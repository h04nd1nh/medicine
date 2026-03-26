import 'package:flutter/material.dart';
import '../../models/appointment.dart';
import '../../services/appointment_service.dart';
import 'package:intl/intl.dart';

class AppointmentListScreen extends StatefulWidget {
  @override
  _AppointmentListScreenState createState() => _AppointmentListScreenState();
}

class _AppointmentListScreenState extends State<AppointmentListScreen> {
  late Future<List<Appointment>> _appointmentsFuture;

  @override
  void initState() {
    super.initState();
    _loadAppointments();
  }

  void _loadAppointments() {
    setState(() {
      _appointmentsFuture = AppointmentService.getMyAppointments();
    });
  }

  void _cancelAppointment(int id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Xác nhận'),
        content: Text('Bạn có chắc chắn muốn hủy lịch khám này không?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text('Không', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: Text('Hủy Lịch', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final success = await AppointmentService.cancelAppointment(id);
      if (success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Hủy lịch thành công')));
          _loadAppointments();
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi khi hủy lịch')));
        }
      }
    }
  }

  String _formatDate(String isoString) {
    try {
      final date = DateTime.parse(isoString);
      return DateFormat('dd/MM/yyyy').format(date);
    } catch (e) {
      return isoString;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'PENDING':
        return Colors.orange;
      case 'CONFIRMED':
        return Colors.green;
      case 'COMPLETED':
        return Colors.blue;
      case 'CANCELLED':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'PENDING':
        return 'Chờ XN';
      case 'CONFIRMED':
        return 'Đã XN';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Lịch Khám Của Tôi'),
      ),
      body: FutureBuilder<List<Appointment>>(
        future: _appointmentsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Đã xảy ra lỗi, vui lòng thử lại.'));
          }

          final appointments = snapshot.data ?? [];

          if (appointments.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.event_busy, size: 80, color: Colors.grey[400]),
                  SizedBox(height: 16),
                  Text('Bạn chưa có lịch hẹn nào', style: TextStyle(fontSize: 16, color: Colors.grey[600])),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16.0),
            itemCount: appointments.length,
            itemBuilder: (context, index) {
              final apt = appointments[index];
              final isCancellable = apt.status == 'PENDING' || apt.status == 'CONFIRMED';
              
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
                          Text(
                            'Ngày: ${_formatDate(apt.date)}',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          Container(
                            padding: EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            decoration: BoxDecoration(
                              color: _getStatusColor(apt.status).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              _getStatusText(apt.status),
                              style: TextStyle(
                                color: _getStatusColor(apt.status),
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          )
                        ],
                      ),
                      SizedBox(height: 8),
                      Text('Giờ: ${apt.time}', style: TextStyle(fontSize: 14)),
                      if (apt.notes != null && apt.notes!.isNotEmpty) ...[
                        SizedBox(height: 8),
                        Text('Ghi chú: ${apt.notes}', style: TextStyle(color: Colors.grey[700])),
                      ],
                      if (isCancellable) ...[
                        Divider(height: 24),
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton.icon(
                            onPressed: () => _cancelAppointment(apt.id),
                            icon: Icon(Icons.cancel, color: Colors.red),
                            label: Text('Hủy Lịch', style: TextStyle(color: Colors.red)),
                          ),
                        )
                      ]
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
