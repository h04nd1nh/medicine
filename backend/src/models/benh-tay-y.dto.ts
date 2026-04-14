export class CreateBenhTayYDto {
  ten_benh: string;
  id_chung_benh: number;
  bai_thuoc_ids?: number[];
  trieu_chung_ids?: number[];
  thiet_chan_ids?: number[];
  mach_chan_ids?: number[];
  /** Danh mục pháp trị (luận trị) gắn với bệnh Tây y */
  phap_tri_ids?: number[];
}

export class UpdateBenhTayYDto {
  ten_benh?: string;
  id_chung_benh?: number;
  bai_thuoc_ids?: number[];
  trieu_chung_ids?: number[];
  thiet_chan_ids?: number[];
  mach_chan_ids?: number[];
  phap_tri_ids?: number[];
}
