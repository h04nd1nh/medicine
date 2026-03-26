class Patient {
  final int id;
  final String? fullName;
  final String? phone;

  Patient({required this.id, this.fullName, this.phone});

  factory Patient.fromJson(Map<String, dynamic> json) {
    return Patient(
      id: json['id'],
      fullName: json['fullName'],
      phone: json['phone'],
    );
  }
}
