export class CreateAppointmentDto {
  patientId?: number; // Optional, can be derived from token for patient
  appointmentDate: string;
  appointmentTime: string;
  reason?: string;
  notes?: string;
}

export class UpdateAppointmentDto {
  appointmentDate?: string;
  appointmentTime?: string;
  status?: string;
  reason?: string;
  notes?: string;
}
