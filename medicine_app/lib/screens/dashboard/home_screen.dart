import 'package:flutter/material.dart';
import '../../models/patient.dart';
import '../../services/auth_service.dart';
import '../auth/login_screen.dart';
import '../records/medical_records_screen.dart';
import '../appointments/book_appointment_screen.dart';
import '../appointments/appointment_list_screen.dart';

class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Patient? _patient;

  @override
  void initState() {
    super.initState();
    _loadPatient();
  }

  void _loadPatient() async {
    final patient = await AuthService.getCurrentPatient();
    if (mounted) {
      if (patient == null) {
        Navigator.pushReplacement(context, MaterialPageRoute(builder: (context) => LoginScreen()));
      } else {
        setState(() => _patient = patient);
      }
    }
  }

  void _logout() async {
    await AuthService.logout();
    if (mounted) {
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (context) => LoginScreen()));
    }
  }

  Widget _buildDashboardCard(String title, IconData icon, Color color, VoidCallback onTap) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
                child: Icon(icon, size: 40, color: color),
              ),
              SizedBox(height: 16),
              Text(title, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_patient == null) {
      return Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text('Sức Khỏe Của Tôi'),
        backgroundColor: Theme.of(context).primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(icon: Icon(Icons.logout), onPressed: _logout),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Theme.of(context).primaryColor, Theme.of(context).primaryColorLight],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Xin chào,',
                    style: TextStyle(color: Colors.white70, fontSize: 16),
                  ),
                  SizedBox(height: 8),
                  Text(
                    _patient!.fullName ?? 'Bệnh nhân',
                    style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 4),
                  Text(
                    _patient!.phone ?? '',
                    style: TextStyle(color: Colors.white70, fontSize: 14),
                  ),
                ],
              ),
            ),
            SizedBox(height: 24),
            Text('Dịch vụ', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            SizedBox(height: 16),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: NeverScrollableScrollPhysics(),
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              children: [
                _buildDashboardCard(
                  'Đặt Lịch Khám',
                  Icons.calendar_month,
                  Colors.blue,
                  () => Navigator.push(context, MaterialPageRoute(builder: (_) => BookAppointmentScreen())),
                ),
                _buildDashboardCard(
                  'Lịch Sử Khám',
                  Icons.history,
                  Colors.green,
                  () => Navigator.push(context, MaterialPageRoute(builder: (_) => MedicalRecordsScreen())),
                ),
                _buildDashboardCard(
                  'Lịch Hẹn Của Tôi',
                  Icons.event_note,
                  Colors.orange,
                  () => Navigator.push(context, MaterialPageRoute(builder: (_) => AppointmentListScreen())),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
