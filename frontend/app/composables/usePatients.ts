export interface Patient {
  id: number
  fullName: string
  gender: string
  dateOfBirth: string | null
  timeOfBirth: string | null
  address: string | null
  province: string | null
  phone: string | null
  medicalHistory: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface CreatePatientDto {
  fullName: string
  gender: string
  dateOfBirth?: string
  timeOfBirth?: string
  address?: string
  province?: string
  phone?: string
  medicalHistory?: string
  notes?: string
}

export const usePatients = () => {
  const config = useRuntimeConfig()
  const { token } = useAuth()

  const baseURL = config.public.apiBase

  const authHeaders = computed(() => ({
    Authorization: `Bearer ${token.value}`
  }))

  const fetchAll = (): Promise<Patient[]> => {
    return $fetch<Patient[]>('/patients', {
      baseURL,
      headers: authHeaders.value
    })
  }

  const fetchOne = (id: number): Promise<Patient> => {
    return $fetch<Patient>(`/patients/${id}`, {
      baseURL,
      headers: authHeaders.value
    })
  }

  const create = (dto: CreatePatientDto): Promise<Patient> => {
    return $fetch<Patient>('/patients', {
      baseURL,
      method: 'POST',
      headers: authHeaders.value,
      body: dto
    })
  }

  const update = (id: number, dto: Partial<CreatePatientDto>): Promise<Patient> => {
    return $fetch<Patient>(`/patients/${id}`, {
      baseURL,
      method: 'PUT',
      headers: authHeaders.value,
      body: dto
    })
  }

  const remove = (id: number): Promise<void> => {
    return $fetch<void>(`/patients/${id}`, {
      baseURL,
      method: 'DELETE',
      headers: authHeaders.value
    })
  }

  return { fetchAll, fetchOne, create, update, remove }
}
