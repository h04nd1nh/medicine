import 'package:flutter/material.dart';
import '../../models/examination.dart';
import '../../services/record_service.dart';
import 'package:intl/intl.dart';

class MedicalRecordsScreen extends StatefulWidget {
  @override
  _MedicalRecordsScreenState createState() => _MedicalRecordsScreenState();
}

class _MedicalRecordsScreenState extends State<MedicalRecordsScreen> {
  late Future<List<Examination>> _recordsFuture;

  @override
  void initState() {
    super.initState();
    _recordsFuture = RecordService.getMyRecords();
  }

  String _formatDate(String isoString) {
    try {
      final date = DateTime.parse(isoString).toLocal();
      return DateFormat('dd/MM/yyyy HH:mm').format(date);
    } catch (e) {
      return isoString;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Lịch Sử Khám Bệnh'),
      ),
      body: FutureBuilder<List<Examination>>(
        future: _recordsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Đã xảy ra lỗi, vui lòng thử lại sau.'));
          }

          final records = snapshot.data ?? [];

          if (records.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.history_toggle_off, size: 80, color: Colors.grey[400]),
                  SizedBox(height: 16),
                  Text('Bạn chưa có phiếu khám nào', style: TextStyle(fontSize: 16, color: Colors.grey[600])),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16.0),
            itemCount: records.length,
            itemBuilder: (context, index) {
              final record = records[index];
              return Card(
                elevation: 2,
                margin: EdgeInsets.only(bottom: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Mã phiếu: #${record.id}', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          Text(_formatDate(record.createdAt), style: TextStyle(color: Colors.grey[600], fontSize: 14)),
                        ],
                      ),
                      Divider(height: 24),
                      Text('Âm dương: ${record.amDuong}', style: TextStyle(fontSize: 14)),
                      SizedBox(height: 4),
                      Text('Khí: ${record.khi}', style: TextStyle(fontSize: 14)),
                      SizedBox(height: 4),
                      Text('Huyết: ${record.huyet}', style: TextStyle(fontSize: 14)),
                      if (record.syndromes != null && record.syndromes!.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 12.0),
                          child: Text(
                            'Chứng bệnh chẩn đoán: ${record.syndromes!.length}',
                            style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).primaryColor),
                          ),
                        )
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
