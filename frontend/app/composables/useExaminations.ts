export interface ExaminationFlag {
  channelIndex: number
  channelName: string
  L: number
  R: number
  Avg: number
  c8: number
  c10: number
  c11: number
  c12: number
}

export interface Examination {
  id: number
  patientId: number
  inputData: Record<string, number>
  amDuong: string
  khi: string
  huyet: string
  flags: ExaminationFlag[]
  syndromes: Array<Record<string, any>>
  notes: string | null
  createdAt: string
}

export interface CreateExaminationDto {
  patientId: number
  notes?: string
  tieutruongtrai: number
  tieutruongphai: number
  tamtrai: number
  tamphai: number
  tamtieutrai: number
  tamtieuphai: number
  tambaotrai: number
  tambaophai: number
  daitrangtrai: number
  daitrangphai: number
  phetrai: number
  phephai: number
  bangquangtrai: number
  bangquangphai: number
  thantrai: number
  thanphai: number
  damtrai: number
  damphai: number
  vitrai: number
  viphai: number
  cantrai: number
  canphai: number
  tytrai: number
  typhai: number
}

export const useExaminations = () => {
  const config = useRuntimeConfig()
  const { token } = useAuth()

  const baseURL = config.public.apiBase

  const authHeaders = computed(() => ({
    Authorization: `Bearer ${token.value}`
  }))

  const create = (dto: CreateExaminationDto): Promise<Examination> => {
    return $fetch<Examination>('/examinations', {
      baseURL,
      method: 'POST',
      headers: authHeaders.value,
      body: dto
    })
  }

  const fetchByPatient = (patientId: number): Promise<Examination[]> => {
    return $fetch<Examination[]>(`/examinations/patient/${patientId}`, {
      baseURL,
      headers: authHeaders.value
    })
  }

  const fetchOne = (id: number): Promise<Examination> => {
    return $fetch<Examination>(`/examinations/${id}`, {
      baseURL,
      headers: authHeaders.value
    })
  }

  const remove = (id: number): Promise<void> => {
    return $fetch<void>(`/examinations/${id}`, {
      baseURL,
      method: 'DELETE',
      headers: authHeaders.value
    })
  }

  return { create, fetchByPatient, fetchOne, remove }
}
