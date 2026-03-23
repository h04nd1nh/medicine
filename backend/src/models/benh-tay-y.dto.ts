export class CreateBenhTayYDto {
  ten_benh: string;
  id_chung_benh: number;
  bai_thuoc_ids?: number[];
  trieu_chung_ids?: number[];
}

export class UpdateBenhTayYDto {
  ten_benh?: string;
  id_chung_benh?: number;
  bai_thuoc_ids?: number[];
  trieu_chung_ids?: number[];
}
