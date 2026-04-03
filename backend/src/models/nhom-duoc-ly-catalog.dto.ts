export class CreateNhomDuocLyLonDto {
  ten_nhom_lon: string;
}

export class UpdateNhomDuocLyLonDto {
  ten_nhom_lon?: string;
}

export class CreateNhomDuocLyNhoDto {
  /** Bỏ trống / null: nhóm nhỏ độc lập, không thuộc nhóm lớn nào */
  id_nhom_lon?: number | null;
  ten_nhom_nho: string;
  mo_ta?: string;
}

export class UpdateNhomDuocLyNhoDto {
  /** Gửi `null` để gỡ khỏi nhóm lớn */
  id_nhom_lon?: number | null;
  ten_nhom_nho?: string;
  mo_ta?: string;
}

export class SetNhomNhoMembersDto {
  id_vi_thuoc: number[];
}
