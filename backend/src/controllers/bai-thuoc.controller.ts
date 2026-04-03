import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BaiThuoc } from '../models/bai-thuoc.model';
import { BaiThuocChiTiet } from '../models/bai-thuoc-chi-tiet.model';
import { ViThuoc } from '../models/vi-thuoc.model';
import { CreateBaiThuocDto, UpdateBaiThuocDto } from '../models/dongy-thuoc.dto';

@Injectable()
export class BaiThuocService {
  constructor(
    @InjectRepository(BaiThuoc)
    private repo: Repository<BaiThuoc>,
    @InjectRepository(BaiThuocChiTiet)
    private detailRepo: Repository<BaiThuocChiTiet>,
    @InjectRepository(ViThuoc)
    private viThuocRepo: Repository<ViThuoc>,
    private dataSource: DataSource,
  ) {}

  private static readonly BT_VI_RELATIONS = [
    'chiTietViThuoc',
    'chiTietViThuoc.viThuoc',
    'chiTietViThuoc.viThuoc.nhomLinks',
    'chiTietViThuoc.viThuoc.nhomLinks.nhomNho',
    'chiTietViThuoc.viThuoc.nhomLinks.nhomNho.nhomLon',
  ] as const;

  findAll(): Promise<BaiThuoc[]> {
    return this.repo.find({
      relations: [...BaiThuocService.BT_VI_RELATIONS],
      order: { ten_bai_thuoc: 'ASC' },
    });
  }

  findOne(id: number): Promise<BaiThuoc | null> {
    return this.repo.findOne({
      where: { id },
      relations: [...BaiThuocService.BT_VI_RELATIONS],
    });
  }

  async create(dto: CreateBaiThuocDto): Promise<BaiThuoc> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { chi_tiet, ...rest } = dto;
      const bt = this.repo.create(rest);
      const savedBt = await queryRunner.manager.save(bt);

      if (chi_tiet && chi_tiet.length > 0) {
        const details = chi_tiet.map(d => this.detailRepo.create({ ...d, idBaiThuoc: savedBt.id }));
        await queryRunner.manager.save(details);
      }
      await queryRunner.commitTransaction();
      return this.findOne(savedBt.id) as Promise<BaiThuoc>;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, dto: UpdateBaiThuocDto): Promise<BaiThuoc | null> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { chi_tiet, ...rest } = dto;
      await queryRunner.manager.update(BaiThuoc, id, rest);

      if (chi_tiet) {
        // Xóa cũ thêm mới cho đơn giản
        await queryRunner.manager.delete(BaiThuocChiTiet, { idBaiThuoc: id });
        const details = chi_tiet.map(d => this.detailRepo.create({ ...d, idBaiThuoc: id }));
        await queryRunner.manager.save(details);
      }
      await queryRunner.commitTransaction();
      return this.findOne(id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  // ─── PHÂN TÍCH BÀI THUỐC (Radar Chart Algorithm) ────────────────────────────
  async analyzeBaiThuoc(id: number): Promise<any> {
    const baiThuoc = await this.findOne(id);
    if (!baiThuoc || !baiThuoc.chiTietViThuoc || baiThuoc.chiTietViThuoc.length === 0) {
      return { success: false, error: 'Không tìm thấy bài thuốc hoặc bài thuốc chưa có vị thuốc.' };
    }

    const details = baiThuoc.chiTietViThuoc;

    // Bước 1: Chuẩn hóa liều lượng sang gram (số thực)
    const parseLieu = (lieu: string | null | undefined): number => {
      if (!lieu) return 9; // default 9g
      const s = (lieu || '').trim().toLowerCase();
      if (s === '*') return 2.25;  // 1.5g - 3g avg
      if (s === '#') return 22.5;  // 15g - 30g avg
      // Xử lý "X tiền" -> gram (1 tiền ≈ 3g)
      const tienMatch = s.match(/^([\d.]+)\s*tiền?$/);
      if (tienMatch) return parseFloat(tienMatch[1]) * 3;
      // Xử lý "X lượng" -> gram (1 lượng ≈ 30g)
      const luongMatch = s.match(/^([\d.]+)\s*lư?ợng?$/);
      if (luongMatch) return parseFloat(luongMatch[1]) * 30;
      // Xử lý "Xg"
      const gMatch = s.match(/^([\d.]+)\s*g?$/);
      if (gMatch) return parseFloat(gMatch[1]);
      return 9; // fallback
    };

    // Lấy dữ liệu vị thuốc đầy đủ
    const items = await Promise.all(details.map(async (d) => {
      const vt = d.viThuoc || await this.viThuocRepo.findOneBy({ id: d.idViThuoc });
      const gram = parseLieu(d.lieu_luong);
      return { d, vt, gram };
    }));

    const validItems = items.filter(x => x.vt != null);
    if (validItems.length === 0) {
      return { success: false, error: 'Không có dữ liệu vị thuốc để phân tích.' };
    }

    const totalWeight = validItems.reduce((sum, x) => sum + x.gram, 0);
    if (totalWeight === 0) return { success: false, error: 'Tổng liều lượng = 0, không thể tính.' };

    // Quy Kinh tổng (tích lũy liều lượng)
    const quyKinhRadar: Record<string, number> = {};
    for (const { d, vt, gram } of validItems) {
      // Ưu tiên quy_kinh của vị thuốc; nếu không có thì dùng quy_kinh trong chi tiết
      const qkStr = vt.quy_kinh || d.quy_kinh || '';
      const kinhList = qkStr.split(/[,;，、]/).map(k => k.trim()).filter(Boolean);
      for (const k of kinhList) {
        quyKinhRadar[k] = (quyKinhRadar[k] || 0) + gram;
      }
    }

    // Normalize Quy Kinh về 0-100
    const maxQK = Math.max(...Object.values(quyKinhRadar), 1);
    const quyKinhNormalized: Record<string, number> = {};
    for (const k in quyKinhRadar) {
      quyKinhNormalized[k] = Math.round((quyKinhRadar[k] / maxQK) * 100);
    }

    // Bước 3: Phân loại Quân - Thần - Tá - Sứ
    const sortedByGram = [...validItems].sort((a, b) => b.gram - a.gram);
    let quanItem = sortedByGram[0];
    const quanQuyKinh = quanItem?.vt?.quy_kinh?.split(/[,;，、]/).map(k => k.trim()) || [];

    const roleMap: Record<number, string> = {};
    for (const item of sortedByGram) {
      const vithuocId = item.vt.id;
      const ten = (item.vt.ten_vi_thuoc || '').toLowerCase();
      const phanTramLieu = item.gram / totalWeight;
      const vtQuyKinh = (item.vt.quy_kinh || '').split(/[,;，、]/).map(k => k.trim());

      if (item === quanItem) {
        roleMap[vithuocId] = 'Quân';
      } else if ((ten === 'cam thảo' || ten === 'đại táo' || ten.includes('cam thảo')) && phanTramLieu < 0.1) {
        roleMap[vithuocId] = 'Sứ';
      } else if (phanTramLieu > 0.15 && vtQuyKinh.some(k => quanQuyKinh.includes(k))) {
        roleMap[vithuocId] = 'Thần';
      } else {
        roleMap[vithuocId] = 'Tá';
      }
    }

    // Danh sách vị thuốc đã phân tích
    const subNhomFromVt = (vt: ViThuoc): string[] => {
      const links = (vt as any).nhomLinks as { nhomNho?: { ten_nhom_nho?: string } }[] | undefined;
      if (!links?.length) return [];
      return [...new Set(links.map((l) => (l.nhomNho?.ten_nhom_nho || '').trim()).filter(Boolean))];
    };

    const viThuocList = validItems.map(({ d, vt, gram }) => ({
      id: vt.id,
      ten: vt.ten_vi_thuoc,
      lieu_luong_text: d.lieu_luong,
      lieu_gram: gram,
      nhom_sub: subNhomFromVt(vt),
      quy_kinh: vt.quy_kinh || '',
      vai_tro_phan_tich: roleMap[vt.id] || 'Tá',
      vai_tro_nhap: d.vai_tro || '',
      phan_tram: Math.round((gram / totalWeight) * 100),
    }));

    return {
      success: true,
      ten_bai_thuoc: baiThuoc.ten_bai_thuoc,
      tong_lieu_luong: totalWeight,
      quy_kinh_radar: quyKinhNormalized,
      quy_kinh_raw: quyKinhRadar,
      vi_thuoc_list: viThuocList,
    };
  }
}
