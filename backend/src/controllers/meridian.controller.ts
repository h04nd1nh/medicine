import { BadRequestException, Injectable } from '@nestjs/common';
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
  /**
   * Danh sách mô hình bệnh lý gợi ý (đã xếp hạng theo % khớp)
   * rate: tỉ lệ khớp (0..1) trên các điều kiện có trong mô hình
   */
  syndromes: Array<MeridianSyndrome & { rate?: number; matchScore?: number; totalInModel?: number }>;
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

  /**
   * Chuẩn hoá dữ liệu nhiệt độ kinh lạc về đúng khoảng sinh lý 20..40 °C.
   *
   * Quy tắc:
   * - Nếu val = 0: coi là chưa đo -> giữ nguyên 0
   * - Nếu val nằm trong [20,40]: giữ nguyên
   * - Nếu val > 40:
   *    - thử chia theo 10^k (k=1..4) để đưa về [20,40]
   *      (vd 354 -> 35.4; 3544 -> 35.44)
   *    - nếu không có k phù hợp: báo lỗi để tránh quy đổi sai
   */
  private normalizeChannelValue(val: number, fieldName: string): number {
    if (!Number.isFinite(val) || val === 0) return 0;

    // Đã đúng đơn vị
    if (val >= 20 && val <= 40) return val;

    // Rất có thể người dùng nhập theo dạng "x10" hoặc "x100" cho đúng số lẻ
    if (val > 40) {
      const maxPow = 4; // cho phép tối đa 4 chữ số "nhân lên"
      for (let pow = 1; pow <= maxPow; pow++) {
        const cand = val / Math.pow(10, pow);
        if (cand >= 20 && cand <= 40) return this.round2(cand);
      }
    }

    throw new BadRequestException(
      `Giá trị nhiệt độ không hợp lệ (${fieldName} = ${val}). ` +
      `Chỉ chấp nhận trong khoảng 20..40 °C. Nếu bạn nhập theo dạng "x10/x100" ` +
      `(ví dụ 354 -> 35.4, 3544 -> 35.44) thì hệ thống sẽ tự quy đổi.`,
    );
  }

  async analyze(data: AnalyzeInputDto): Promise<AnalyzeOutputDto> {
    // Chuẩn hoá/validate 24 giá trị trước khi tính toán ngưỡng
    // (mutate tại chỗ để các nơi lưu inputData về sau cũng có giá trị chuẩn)
    for (const ch of CHANNELS) {
      const leftKey = `${ch}trai` as keyof AnalyzeInputDto;
      const rightKey = `${ch}phai` as keyof AnalyzeInputDto;
      (data as any)[leftKey] = this.normalizeChannelValue((data as any)[leftKey], String(leftKey));
      (data as any)[rightKey] = this.normalizeChannelValue((data as any)[rightKey], String(rightKey));
    }

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
      const allVals = [...leftArr, ...rightArr].filter(v => v > 0);
      if (allVals.length === 0) {
        return { midPoint: 0, dungSai: 0, upperLimit: 0, lowerLimit: 0 };
      }

      const sum = allVals.reduce((a, b) => a + b, 0);
      const avg = this.round2(sum / allVals.length);
      
      const maxVal = Math.max(...allVals);
      const minVal = Math.min(...allVals);
      const range = maxVal - minVal;

      // Trong phương pháp Lê Văn Sửu, midPoint chính là giá trị trung bình cộng
      const midPoint = avg;
      const dungSai = this.round2(range / 6.0);

      return {
        midPoint,
        dungSai,
        upperLimit: this.round2(midPoint + dungSai),
        lowerLimit: this.round2(midPoint - dungSai),
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

      // C10: Trong Kinhlac.exe, c10 đại diện cho trạng thái của kinh (Hàn/Bình/Nhiệt)
      // nên nó phải so với giới hạn hành lang (upperLimit/lowerLimit)
      const c10 = avg > bounds.upperLimit ? 1 : (avg < bounds.lowerLimit ? -1 : 0);

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

    // --- Bước 3: Suy luận Âm-Dương & Khí-Huyết (theo DiagnosisLogic) ---
    // Đếm Hư / Thực ở chi trên (THỦ) và chi dưới (TÚC)
    let thucTren = 0, huTren = 0, thucDuoi = 0, huDuoi = 0;
    for (let i = 0; i < 12; i++) {
      const bounds = i < 6 ? boundsUpper : boundsLower;
      const L = leftChannels[i];
      const R = rightChannels[i];
      const isThuc = L > bounds.upperLimit || R > bounds.upperLimit;
      const isHu = L < bounds.lowerLimit || R < bounds.lowerLimit;
      if (i < 6) {
        if (isThuc) thucTren++;
        if (isHu) huTren++;
      } else {
        if (isThuc) thucDuoi++;
        if (isHu) huDuoi++;
      }
    }

    // Âm / Dương toàn thân: so sánh trung bình chi trên (THỦ) vs chi dưới (TÚC)
    // Ngưỡng 0.6 là ngưỡng nhạy thường dùng trong phương pháp Lê Văn Sửu
    const avg_tren = boundsUpper.midPoint;
    const avg_duoi = boundsLower.midPoint;
    const amDuongBody =
      avg_tren > avg_duoi + 0.6 ? 'DƯƠNG THỊNH' :
      avg_duoi > avg_tren + 0.6 ? 'ÂM THỊNH' :
      'CÂN BẰNG';

    // Map về dạng lâm sàng: Âm hư / Dương hư / Cân bằng
    const am_duong =
      amDuongBody === 'DƯƠNG THỊNH' ? 'Âm hư' :
      amDuongBody === 'ÂM THỊNH' ? 'Dương hư' :
      'Cân bằng';

    // Khí: dựa trên Hư / Thực ở chi trên
    const khi =
      thucTren > huTren ? 'Khí thịnh' :
      thucTren < huTren ? 'Khí hư' :
      'Bình thường';

    // Huyết: dựa trên Hư / Thực ở chi dưới
    const huyet =
      thucDuoi > huDuoi ? 'Huyết thịnh' :
      thucDuoi < huDuoi ? 'Huyết hư' :
      'Bình thường';

    // --- Bước 4: Khớp CSDL bệnh chứng luận trị (Logic chấm điểm tương đồng) ---
    const allSyndromes = await this.meridianRepo.find();

    const suggested = allSyndromes.map(dbRow => {
      let score = 0;
      let totalConditions = 0;
      let matchedConditions = 0;

      for (let i = 0; i < 12; i++) {
        const ch = CHANNELS[i];
        const f = flags[i];
        
        // Lấy điều kiện từ DB cho kinh này (c10, c8, c11)
        const dbC10 = (dbRow[ch as keyof MeridianSyndrome] as number) ?? 0;
        const dbC8 = (dbRow[`${ch}_c8` as keyof MeridianSyndrome] as number) ?? 0;
        const dbC11 = (dbRow[`${ch}_c11` as keyof MeridianSyndrome] as number) ?? 0;

        // Nếu DB có quy định trạng thái cho kinh này
        if (dbC10 !== 0 || dbC8 !== 0 || dbC11 !== 0) {
          totalConditions++;
          
          let channelMatched = true;
          let weight = 1.0;

          // Kiểm tra khớp từng flag nếu DB có quy định
          if (dbC10 !== 0 && dbC10 !== f.c10) channelMatched = false;
          if (dbC8 !== 0 && dbC8 !== f.c8) channelMatched = false;
          if (dbC11 !== 0 && dbC11 !== f.c11) channelMatched = false;

          if (channelMatched) {
            matchedConditions++;
            // Nếu kinh này đang ở trạng thái Thực/Hư rõ rệt (ngoài corridor) thì tăng trọng số điểm
            if (f.c8 !== 0 || f.c11 !== 0) weight = 1.5;
            score += weight;
          }
        }
      }

      // Tỷ lệ khớp dựa trên số điều kiện đã khớp / tổng số điều kiện của mẫu bệnh đó
      const rate = totalConditions > 0 ? matchedConditions / totalConditions : 0;
      
      return Object.assign(dbRow, { 
        rate, 
        matchScore: score, 
        matchedCount: matchedConditions,
        totalInModel: totalConditions 
      });
    })
    // Lọc các mô hình có độ tương đồng cao (trên 60% hoặc khớp tuyệt đối)
    .filter(m => (m.totalInModel ?? 0) > 0 && (m.rate ?? 0) >= 0.6)
    .sort((a, b) => {
      // Ưu tiên khớp tuyệt đối (rate=1), sau đó đến điểm số (score) và tỷ lệ (rate)
      if (a.rate === 1 && b.rate !== 1) return -1;
      if (a.rate !== 1 && b.rate === 1) return 1;
      return (b.matchScore ?? 0) - (a.matchScore ?? 0) || (b.rate ?? 0) - (a.rate ?? 0);
    })
    .slice(0, 15);

    return {
      am_duong,
      khi,
      huyet,
      flags,
      syndromes: suggested,
    };
  }
}
