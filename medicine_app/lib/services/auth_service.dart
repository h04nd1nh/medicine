import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/patient.dart';
import 'api_service.dart';

class AuthService {
  static Future<Patient?> login(String phone, String password) async {
    final response = await ApiService.post('/patient-auth/login', {
      'phone': phone,
      'password': password,
    });

    if (response.statusCode == 200 || response.statusCode == 201) {
      final json = jsonDecode(response.body);
      final token = json['access_token'];
      final patientJson = json['patient'];
      
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', token);
      await prefs.setString('patient_data', jsonEncode(patientJson));
      
      return Patient.fromJson(patientJson);
    }
    return null;
  }

  static Future<Patient?> register(String phone, String password, String fullName) async {
    final response = await ApiService.post('/patient-auth/register', {
      'phone': phone,
      'password': password,
      'fullName': fullName,
    });

    if (response.statusCode == 200 || response.statusCode == 201) {
      final json = jsonDecode(response.body);
      final token = json['access_token'];
      final patientJson = json['patient'];
      
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', token);
      await prefs.setString('patient_data', jsonEncode(patientJson));
      
      return Patient.fromJson(patientJson);
    }
    return null;
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('patient_data');
  }

  static Future<Patient?> getCurrentPatient() async {
    final prefs = await SharedPreferences.getInstance();
    final patientStr = prefs.getString('patient_data');
    if (patientStr != null) {
      return Patient.fromJson(jsonDecode(patientStr));
    }
    return null;
  }
  
  static Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token') != null;
  }
}
