import 'package:flutter/material.dart';
import '../../services/auth_service.dart';
import '../../services/notification_service.dart';
import '../dashboard/home_screen.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  void _login() async {
    setState(() => _isLoading = true);
    final patient = await AuthService.login(
      _phoneController.text.trim(),
      _passwordController.text,
    );
    setState(() => _isLoading = false);

    if (patient != null) {
      if (mounted) {
        // Sync FCM token with backend
        await NotificationService.syncToken();

        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => HomeScreen()),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Đăng nhập thất bại. Kiểm tra lại số điện thoại và mật khẩu.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Icon(
                  Icons.local_hospital_rounded,
                  size: 80,
                  color: Theme.of(context).primaryColor,
                ),
                SizedBox(height: 24),
                Text(
                  'Chào mừng',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.black87),
                ),
                SizedBox(height: 8),
                Text(
                  'Ứng dụng theo dõi sức khỏe đông y',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                ),
                SizedBox(height: 48),
                TextField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: InputDecoration(
                    labelText: 'Số điện thoại',
                    prefixIcon: Icon(Icons.phone),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                SizedBox(height: 16),
                TextField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: 'Mật khẩu',
                    prefixIcon: Icon(Icons.lock),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _isLoading ? null : _login,
                  style: ElevatedButton.styleFrom(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    backgroundColor: Theme.of(context).primaryColor,
                  ),
                  child: _isLoading
                      ? SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white))
                      : Text('ĐĂNG NHẬP', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                ),
                SizedBox(height: 16),
                TextButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => RegisterScreen()),
                    );
                  },
                  child: Text('Chưa có tài khoản? Đăng ký ngay'),
                )
              ],
            ),
          ),
        ),
      ),
    );
  }
}
