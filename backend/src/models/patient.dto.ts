export class CreatePatientDto {
  fullName: string;
  gender: string;
  dateOfBirth?: string;
  timeOfBirth?: string;
  address?: string;
  province?: string;
  phone?: string;
  medicalHistory?: string;
  notes?: string;
}

export class UpdatePatientDto {
  fullName?: string;
  gender?: string;
  dateOfBirth?: string;
  timeOfBirth?: string;
  address?: string;
  province?: string;
  phone?: string;
  medicalHistory?: string;
  notes?: string;
}
