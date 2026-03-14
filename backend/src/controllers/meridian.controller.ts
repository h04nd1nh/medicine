import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeridianSyndrome } from '../models/meridian-syndrome.model';

export class AnalyzeInputDto {
  tieutruongtrai: number;
  tieutruongphai: number;
  tamtrai: number;
  tamphai: number;
  tamtieutrai: number;
  tamtieuphai: number;
  tambaotrai: number;
  tambaophai: number;
  daitrangtrai: number;
  daitrangphai: number;
  phetrai: number;
  phephai: number;
  bangquangtrai: number;
  bangquangphai: number;
  thantrai: number;
  thanphai: number;
  damtrai: number;
  damphai: number;
  vitrai: number;
  viphai: number;
  cantrai: number;
  canphai: number;
  tytrai: number;
  typhai: number;
}

export class AnalyzeOutputDto {
  am_duong: string;
  khi: string;
  huyet: string;
  flags: Array<{
    channelIndex: number;
    channelName: string;
    L: number;
    R: number;
    Avg: number;
    c8: number;
    c10: number;
    c11: number;
    c12: number;
  }>;
  syndromes: MeridianSyndrome[];
}

const CHANNELS = [
  'tieutruong', // 0: Tiểu trường
  'tam',        // 1: Tâm
  'tamtieu',    // 2: Tam tiêu
  'tambao',     // 3: Tâm bào
  'daitrang',   // 4: Đại tràng
  'phe',        // 5: Phế
  'bangquang',  // 6: Bàng quang
  'than',       // 7: Thận
  'dam',        // 8: Đảm
  'vi',         // 9: Vị
  'can',        // 10: Can
  'ty',         // 11: Tỳ
];

@Injectable()
export class MeridiansService {
  constructor(
    @InjectRepository(MeridianSyndrome)
    private readonly meridianRepo: Repository<MeridianSyndrome>,
  ) {}

  private round2(n: number): number {
    return Math.round(n * 100) / 100;
  }

  async analyze(data: AnalyzeInputDto): Promise<AnalyzeOutputDto> {
    const leftChannels = [
      data.tieutruongtrai,
      data.tamtrai,
      data.tamtieutrai,
      data.tambaotrai,
      data.daitrangtrai,
      data.phetrai,
      data.bangquangtrai,
      data.thantrai,
      data.damtrai,
      data.vitrai,
      data.cantrai,
      data.tytrai,
    ];

    const rightChannels = [
      data.tieutruongphai,
      data.tamphai,
      data.tamtieuphai,
      data.tambaophai,
      data.daitrangphai,
      data.phephai,
      data.bangquangphai,
      data.thanphai,
      data.damphai,
      data.viphai,
      data.canphai,
      data.typhai,
    ];

    if ((leftChannels as any[]).includes(undefined) || (rightChannels as any[]).includes(undefined)) {
      throw new Error('Invalid input, must provide all 24 specific channels.');
    }

    // --- Bước 2.1: Tính Khung Sinh Lý (làm tròn 2 chữ số như code gốc) ---
    const calculateBounds = (leftArr: number[], rightArr: number[]) => {
      const allVals = [...leftArr, ...rightArr];
      const maxVal = Math.max(...allVals);
      const minVal = Math.min(...allVals);
      const range = maxVal - minVal;
      const midPoint = this.round2((maxVal + minVal) / 2.0);
      const dungSai = this.round2(range / 6.0);

      return {
        midPoint,
        dungSai,
        upperLimit: midPoint + dungSai,
        lowerLimit: midPoint - dungSai,
      };
    };

    const boundsUpper = calculateBounds(leftChannels.slice(0, 6), rightChannels.slice(0, 6));
    const boundsLower = calculateBounds(leftChannels.slice(6, 12), rightChannels.slice(6, 12));

    // --- Bước 2.2: Tính Cờ Trạng Thái (Flags) ---
    const flags: AnalyzeOutputDto['flags'] = [];
    for (let i = 0; i < 12; i++) {
      const bounds = i < 6 ? boundsUpper : boundsLower;

      const L = leftChannels[i];
      const R = rightChannels[i];
      const avg = this.round2((L + R) / 2.0);

      // C10: col_10 = round(avg - midPoint, 2) rồi lấy dấu
      const c10_val = this.round2(avg - bounds.midPoint);
      const c10 = c10_val > 0 ? 1 : c10_val < 0 ? -1 : 0;

      // C8: trái so với giới hạn
      const c8 = L > bounds.upperLimit ? 1 : L < bounds.lowerLimit ? -1 : 0;

      // C11: phải so với giới hạn
      const c11 = R > bounds.upperLimit ? 1 : R < bounds.lowerLimit ? -1 : 0;

      // C12: lệch 2 bên (không làm tròn, khớp code gốc)
      const diff = L - R;
      const c12 = Math.abs(diff) > bounds.dungSai
        ? (diff > 0 ? 1 : -1)
        : 0;

      flags.push({ channelIndex: i, channelName: CHANNELS[i], L, R, Avg: avg, c8, c10, c11, c12 });
    }

    // --- Bước 3: Suy luận Âm-Dương & Khí-Huyết (khớp code gốc, luôn đếm) ---
    const c10_dam = flags[8].c10;
    const am_duong = c10_dam > 0 ? 'Âm hư' : c10_dam < 0 ? 'Dương hư' : 'Bình thường';

    const countKhi = flags.slice(0, 6).filter(f => f.c10 > 0).length;
    const khi = countKhi > 3 ? 'Khí thịnh' : countKhi < 3 ? 'Khí hư' : 'Bình thường';

    const countHuyet = flags.slice(6, 12).filter(f => f.c10 > 0).length;
    const huyet = countHuyet > 3 ? 'Huyết thịnh' : countHuyet < 3 ? 'Huyết hư' : 'Bình thường';

    // --- Bước 4: Khớp CSDL bệnh chứng luận trị (có flag2 như code gốc) ---
    const allSyndromes = await this.meridianRepo.find();

    const matchedSyndromes = allSyndromes.filter(dbRow => {
      let allMatch = true;
      let hasCondition = false;

      for (let i = 0; i < 12; i++) {
        const f = flags[i];
        const ch = CHANNELS[i];

        const dbC8 = (dbRow[`${ch}_c8` as keyof MeridianSyndrome] as number) ?? 0;
        const dbC10 = (dbRow[ch as keyof MeridianSyndrome] as number) ?? 0;
        const dbC11 = (dbRow[`${ch}_c11` as keyof MeridianSyndrome] as number) ?? 0;

        if (dbC8 !== 0 || dbC10 !== 0 || dbC11 !== 0) {
          hasCondition = true;
          if (dbC8 !== 0 && dbC8 !== f.c8) { allMatch = false; break; }
          if (dbC10 !== 0 && dbC10 !== f.c10) { allMatch = false; break; }
          if (dbC11 !== 0 && dbC11 !== f.c11) { allMatch = false; break; }
        }
      }

      return hasCondition && allMatch;
    });

    return {
      am_duong,
      khi,
      huyet,
      flags,
      syndromes: matchedSyndromes,
    };
  }
}
