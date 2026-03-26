import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/appointment_service.dart';

class BookAppointmentScreen extends StatefulWidget {
  @override
  _BookAppointmentScreenState createState() => _BookAppointmentScreenState();
}

class _BookAppointmentScreenState extends State<BookAppointmentScreen> {
  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;
  final _notesController = TextEditingController();
  bool _isLoading = false;

  void _pickDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(Duration(days: 30)),
    );
    if (date != null) {
      setState(() => _selectedDate = date);
    }
  }

  void _pickTime() async {
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay(hour: 8, minute: 0),
    );
    if (time != null) {
      setState(() => _selectedTime = time);
    }
  }

  void _submit() async {
    if (_selectedDate == null || _selectedTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Vui lòng chọn ngày và giờ.')));
      return;
    }

    setState(() => _isLoading = true);

    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate!);
    final timeStr = '${_selectedTime!.hour.toString().padLeft(2, '0')}:${_selectedTime!.minute.toString().padLeft(2, '0')}';

    final success = await AppointmentService.createAppointment(dateStr, timeStr, _notesController.text.trim());
    setState(() => _isLoading = false);

    if (success) {
      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: Text('Thành công'),
            content: Text('Bạn đã gửi yêu cầu đặt lịch khám thành công. Vui lòng chờ xác nhận.'),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop(); // dismiss dialog
                  Navigator.of(context).pop(); // return to previous screen
                },
                child: Text('OK'),
              )
            ],
          ),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Không thể đặt lịch. Vui lòng thử lại sau.')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text('Đặt Lịch Khám'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Nhập thông tin lịch hẹn', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _pickDate,
                    icon: Icon(Icons.calendar_today),
                    label: Text(_selectedDate == null ? 'Chọn ngày' : DateFormat('dd/MM/yyyy').format(_selectedDate!)),
                    style: OutlinedButton.styleFrom(padding: EdgeInsets.symmetric(vertical: 16)),
                  ),
                ),
                SizedBox(width: 16),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _pickTime,
                    icon: Icon(Icons.access_time),
                    label: Text(_selectedTime == null ? 'Chọn giờ' : _selectedTime!.format(context)),
                    style: OutlinedButton.styleFrom(padding: EdgeInsets.symmetric(vertical: 16)),
                  ),
                ),
              ],
            ),
            SizedBox(height: 24),
            TextField(
              controller: _notesController,
              maxLines: 4,
              decoration: InputDecoration(
                labelText: 'Mô tả triệu chứng / Ghi chú (Tùy chọn)',
                alignLabelWithHint: true,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            SizedBox(height: 32),
            ElevatedButton(
              onPressed: _isLoading ? null : _submit,
              style: ElevatedButton.styleFrom(
                padding: EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                backgroundColor: Theme.of(context).primaryColor,
              ),
              child: _isLoading
                  ? SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white))
                  : Text('XÁC NHẬN ĐẶT LỊCH', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }
}
