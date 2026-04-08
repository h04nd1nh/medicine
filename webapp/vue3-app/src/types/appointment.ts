export interface AppointmentItem {
  id: number
  patientName?: string
  patient_name?: string
  fullName?: string
  phone?: string
  patientPhone?: string
  appointmentDate?: string
  appointment_date?: string
  status?: string
}

export interface AppointmentListResponse {
  data: AppointmentItem[]
  total: number
}
