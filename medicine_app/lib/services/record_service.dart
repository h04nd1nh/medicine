import 'dart:convert';
import '../models/examination.dart';
import 'api_service.dart';

class RecordService {
  static Future<List<Examination>> getMyRecords() async {
    final response = await ApiService.get('/examinations/my-records');
    if (response.statusCode == 200) {
      final List<dynamic> json = jsonDecode(response.body);
      return json.map((x) => Examination.fromJson(x)).toList();
    }
    return [];
  }
}
