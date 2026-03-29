import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'firebase_options.dart';
import 'screens/auth/login_screen.dart';
import 'screens/dashboard/app_shell.dart';
import 'services/auth_service.dart';
import 'services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // 1. Initialize Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // 2. Initialize Date Formatting
  await initializeDateFormatting('vi', null);
  
  // 3. Initialize Notification Service
  await NotificationService.initialize();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Define custom colors based on Web App CSS
    const Color primaryBrown = Color(0xFF5B3A1A); // --primary
    const Color bgLightYellow = Color(0xFFFBF8F1); // --bg-light
    const Color accentBrown = Color(0xFF8B7355); // --accent

    return MaterialApp(
      title: 'Kinh lạc Gia Minh',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: primaryBrown,
          primary: primaryBrown,
          // ignore: deprecated_member_use
          background: bgLightYellow,
          surface: Colors.white,
        ),
        scaffoldBackgroundColor: bgLightYellow,
        primaryColor: primaryBrown,
        useMaterial3: true,
        fontFamily: 'Inter',
        appBarTheme: const AppBarTheme(
          backgroundColor: primaryBrown,
          foregroundColor: bgLightYellow,
          elevation: 0,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF8B1A1A), // --secondary (Đỏ đô)
            foregroundColor: Colors.white,
          ),
        ),
      ),
      home: const InitialScreen(),
    );
  }
}

class InitialScreen extends StatefulWidget {
  const InitialScreen({super.key});

  @override
  State<InitialScreen> createState() => _InitialScreenState();
}

class _InitialScreenState extends State<InitialScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  void _checkAuth() async {
    final isLoggedIn = await AuthService.isLoggedIn();
    if (mounted) {
      if (isLoggedIn) {
        // Sync FCM token upon login session restoration
        NotificationService.syncToken();
        
        Navigator.of(
          context,
        ).pushReplacement(MaterialPageRoute(builder: (context) => AppShell()));
      } else {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => LoginScreen()),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: CircularProgressIndicator()));
  }
}
