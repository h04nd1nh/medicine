import type { LegacyExam, LegacyPatient } from '../types/medical'

interface NestPatientDto {
  id: number
  fullName?: string
  gender?: string
  dateOfBirth?: string
  timeOfBirth?: string | null
  address?: string | null
  phone?: string | null
  medicalHistory?: string | null
  notes?: string | null
}

type AnyRecord = Record<string, unknown>

function toLegacyTicks(dateInput: unknown): string | null {
  if (!dateInput) return null
  const ms = new Date(String(dateInput)).getTime()
  if (Number.isNaN(ms)) return null
  return `/Date(${ms})/`
}

function toLegacyTime(dateInput: unknown): string {
  if (!dateInput) return ''
  const d = new Date(String(dateInput))
  if (Number.isNaN(d.getTime())) return ''
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function numberOrZero(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function mapNestPatientToLegacy(input: NestPatientDto): LegacyPatient {
  return {
    benhnhanId: input.id,
    hoten: input.fullName || '',
    gioitinh: input.gender || '',
    ngaysinh: toLegacyTicks(input.dateOfBirth),
    giosinh: input.timeOfBirth || null,
    diachi: input.address || null,
    tinhthanhId: null,
    dienthoai: input.phone || null,
    benhsu: input.medicalHistory || null,
    ghichu: input.notes || null,
    cmnd: null,
  }
}

export function mapLegacyPatientToNest(payload: LegacyPatient): AnyRecord {
  return {
    fullName: payload.hoten || '',
    gender: payload.gioitinh || '',
    dateOfBirth: payload.ngaysinh || undefined,
    address: payload.diachi || undefined,
    phone: payload.dienthoai || undefined,
    notes: payload.ghichu || undefined,
  }
}

export function mapNestExamToLegacy(exam: AnyRecord): LegacyExam {
  let rawInput: AnyRecord = {}
  const inputField = Object.keys(exam).find((k) => k.toLowerCase() === 'inputdata')
  if (inputField) {
    rawInput = (exam[inputField] as AnyRecord) || {}
  } else {
    rawInput = exam
  }

  if (typeof rawInput === 'string') {
    try {
      rawInput = JSON.parse(rawInput) as AnyRecord
    } catch {
      rawInput = {}
    }
  }

  const input: AnyRecord = {}
  for (const key of Object.keys(rawInput)) {
    input[key.toLowerCase()] = rawInput[key]
  }

  const createdAt = exam.createdAt || exam.createdat
  const phieukhamId = Number(exam.id || exam.phieukhamId || exam.phieukham_id || 0)
  const benhnhanId = Number(exam.patientId || exam.patientid || exam.benhnhanId || 0)

  return {
    phieukhamId,
    benhnhanId,
    ngaykham: toLegacyTicks(createdAt) || String(createdAt || ''),
    giokham: toLegacyTime(createdAt),
    nhietdoMoitruong: numberOrZero(input.nhietdomoitruong),
    tieutruongTrai: numberOrZero(input.tieutruongtrai),
    tieutruongPhai: numberOrZero(input.tieutruongphai),
    tamTrai: numberOrZero(input.tamtrai),
    tamPhai: numberOrZero(input.tamphai),
    tamtieuTrai: numberOrZero(input.tamtieutrai),
    tamtieuPhai: numberOrZero(input.tamtieuphai),
    tambaoTrai: numberOrZero(input.tambaotrai),
    tambaoPhai: numberOrZero(input.tambaophai),
    daitrangTrai: numberOrZero(input.daitrangtrai),
    daitrangPhai: numberOrZero(input.daitrangphai),
    pheTrai: numberOrZero(input.phetrai),
    phePhai: numberOrZero(input.phephai),
    bangquangTrai: numberOrZero(input.bangquangtrai),
    bangquangPhai: numberOrZero(input.bangquangphai),
    thanTrai: numberOrZero(input.thantrai),
    thanPhai: numberOrZero(input.thanphai),
    damTrai: numberOrZero(input.damtrai),
    damPhai: numberOrZero(input.damphai),
    viTrai: numberOrZero(input.vitrai),
    viPhai: numberOrZero(input.viphai),
    canTrai: numberOrZero(input.cantrai),
    canPhai: numberOrZero(input.canphai),
    tyTrai: numberOrZero(input.tytrai),
    tyPhai: numberOrZero(input.typhai),
    _backendSyndromes: (exam.syndromes as unknown[]) || [],
    _backendAmDuong: exam.amDuong,
    _backendKhi: exam.khi,
    _backendHuyet: exam.huyet,
    _backendFlags: (exam.flags as unknown[]) || [],
  }
}

export function mapLegacyExamToNest(payload: LegacyExam): AnyRecord {
  return {
    patientId: Number(payload.benhnhanId),
    tieutruongtrai: numberOrZero(payload.tieutruongTrai),
    tieutruongphai: numberOrZero(payload.tieutruongPhai),
    tamtrai: numberOrZero(payload.tamTrai),
    tamphai: numberOrZero(payload.tamPhai),
    tamtieutrai: numberOrZero(payload.tamtieuTrai),
    tamtieuphai: numberOrZero(payload.tamtieuPhai),
    tambaotrai: numberOrZero(payload.tambaoTrai),
    tambaophai: numberOrZero(payload.tambaoPhai),
    daitrangtrai: numberOrZero(payload.daitrangTrai),
    daitrangphai: numberOrZero(payload.daitrangPhai),
    phetrai: numberOrZero(payload.pheTrai),
    phephai: numberOrZero(payload.phePhai),
    bangquangtrai: numberOrZero(payload.bangquangTrai),
    bangquangphai: numberOrZero(payload.bangquangPhai),
    thantrai: numberOrZero(payload.thanTrai),
    thanphai: numberOrZero(payload.thanPhai),
    damtrai: numberOrZero(payload.damTrai),
    damphai: numberOrZero(payload.damPhai),
    vitrai: numberOrZero(payload.viTrai),
    viphai: numberOrZero(payload.viPhai),
    cantrai: numberOrZero(payload.canTrai),
    canphai: numberOrZero(payload.canPhai),
    tytrai: numberOrZero(payload.tyTrai),
    typhai: numberOrZero(payload.tyPhai),
    notes: undefined,
  }
}
