class Appointment {
  final int id;
  final int patientId;
  final String date;
  final String time;
  final String status;
  final String? notes;

  Appointment({
    required this.id,
    required this.patientId,
    required this.date,
    required this.time,
    required this.status,
    this.notes,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['id'],
      patientId: json['patientId'],
      date: json['appointmentDate'],
      time: json['appointmentTime'],
      status: json['status'],
      notes: json['notes'],
    );
  }
}
