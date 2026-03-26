import 'dart:convert';
import '../models/appointment.dart';
import 'api_service.dart';

class AppointmentService {
  static Future<List<Appointment>> getMyAppointments() async {
    final response = await ApiService.get('/appointments/my-appointments');
    if (response.statusCode == 200) {
      final List<dynamic> json = jsonDecode(response.body);
      return json.map((x) => Appointment.fromJson(x)).toList();
    }
    return [];
  }

  static Future<bool> createAppointment(String date, String time, String notes) async {
    final response = await ApiService.post('/appointments/my-appointments', {
      'appointmentDate': date,
      'appointmentTime': time,
      'reason': notes, // mapped to reason
      'notes': notes,
    });
    
    return response.statusCode == 200 || response.statusCode == 201;
  }

  static Future<bool> cancelAppointment(int id) async {
    final response = await ApiService.put('/appointments/my-appointments/$id/cancel');
    return response.statusCode == 200;
  }
}
