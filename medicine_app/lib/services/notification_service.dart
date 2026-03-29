import 'dart:convert';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'api_service.dart';
import 'auth_service.dart';

class NotificationService {
  static final FlutterLocalNotificationsPlugin _localNotificationsPlugin = FlutterLocalNotificationsPlugin();

  static Future<void> initialize() async {
    // 1. Initialize Firebase Messaging
    await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    // 2. Setup Foreground Notification Handling
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'high_importance_channel', // id
      'Lịch hẹn', // title
      description: 'Thông báo về lịch hẹn khám bệnh',
      importance: Importance.max,
    );

    await _localNotificationsPlugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);

    const AndroidInitializationSettings initializationSettingsAndroid = AndroidInitializationSettings('@mipmap/ic_launcher');
    const InitializationSettings initializationSettings = InitializationSettings(android: initializationSettingsAndroid);
    
    await _localNotificationsPlugin.initialize(initializationSettings);

    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      RemoteNotification? notification = message.notification;
      AndroidNotification? android = message.notification?.android;

      if (notification != null && android != null) {
        _localNotificationsPlugin.show(
          notification.hashCode,
          notification.title,
          notification.body,
          NotificationDetails(
            android: AndroidNotificationDetails(
              channel.id,
              channel.name,
              channelDescription: channel.description,
              icon: android.smallIcon,
            ),
          ),
          payload: jsonEncode(message.data),
        );
      }
    });

    // 3. Sync Token
    await syncToken();
    
    // Listen for Token Refresh
    FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
      syncToken(token: newToken);
    });
  }

  static Future<void> syncToken({String? token}) async {
    final patient = await AuthService.getCurrentPatient();
    if (patient == null) return;

    final fcmToken = token ?? await FirebaseMessaging.instance.getToken();
    if (fcmToken == null) return;

    print("FcmToken: $fcmToken");

    // Send to Backend
    try {
      await ApiService.put('/patients/${patient.id}/fcm-token', {
        'fcmToken': fcmToken,
      });
    } catch (e) {
      print("Error syncing FCM token: $e");
    }
  }
}
