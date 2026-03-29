export class CreateBenhTayYDto {
  ten_benh: string;
  id_chung_benh: number;
  bai_thuoc_ids?: number[];
  trieu_chung_ids?: number[];
  thiet_chan?: string;
  mach_chan?: string;
}

export class UpdateBenhTayYDto {
  ten_benh?: string;
  id_chung_benh?: number;
  bai_thuoc_ids?: number[];
  trieu_chung_ids?: number[];
  thiet_chan?: string;
  mach_chan?: string;
}
