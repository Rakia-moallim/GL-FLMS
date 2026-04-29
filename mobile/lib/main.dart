import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'screens/welcome_screen.dart';
import 'screens/login_screen.dart';
import 'screens/main_nav_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase as the default app.
  try {
    await Firebase.initializeApp(
      options: const FirebaseOptions(
        apiKey: 'AIzaSyCOxDVTNHq9rDOC-AbglipGuHrv0aYvnc0',
        appId: '1:206275229351:web:ac600f712bb96d26c60d82',
        messagingSenderId: '206275229351',
        projectId: 'koor-mission-control',
        databaseURL: 'https://koor-mission-control-default-rtdb.firebaseio.com',
        storageBucket: 'koor-mission-control.firebasestorage.app',
      ),
    );
    debugPrint("Firebase initialized successfully");
    
    // Sign in anonymously if not already signed in
    if (FirebaseAuth.instance.currentUser == null) {
      await FirebaseAuth.instance.signInAnonymously();
      debugPrint("Anonymous sign-in successful");
    }
    
    // --- FCM Setup ---
    FirebaseMessaging messaging = FirebaseMessaging.instance;

    // Request permissions for iOS/Android 13+
    NotificationSettings settings = await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      debugPrint('User granted permission');
      
      // Get token
      String? token = await messaging.getToken();
      if (token != null) {
        debugPrint("FCM Token: $token");
        // We'll save this token to Firestore once we have the homeId
        _saveTokenToFirestore(token);
      }
    }

    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // --- Local Notifications (for High Importance Channel) ---
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'high_importance_channel', // id
      'High Importance Notifications', // title
      description: 'This channel is used for critical emergency alerts.', // description
      importance: Importance.max,
    );

    final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

    await flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);

    // Set foreground notification presentation options
    await messaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );

    // Listen for foreground messages and show them locally
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      RemoteNotification? notification = message.notification;
      AndroidNotification? android = message.notification?.android;

      if (notification != null && android != null) {
        flutterLocalNotificationsPlugin.show(
          notification.hashCode,
          notification.title,
          notification.body,
          NotificationDetails(
            android: AndroidNotificationDetails(
              channel.id,
              channel.name,
              channelDescription: channel.description,
              icon: '@mipmap/ic_launcher',
              importance: Importance.max,
              priority: Priority.high,
            ),
          ),
        );
      }
    });

  } catch (e) {
    debugPrint("Firebase init error: $e");
  }

  // Check login state
  final prefs = await SharedPreferences.getInstance();
  final bool isLoggedIn = prefs.getBool('isLoggedIn') ?? false;

  runApp(GLFLMSApp(isLoggedIn: isLoggedIn));
}

// Background message handler
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint("Handling a background message: ${message.messageId}");
}

// Helper to save token to Firestore
Future<void> _saveTokenToFirestore(String token) async {
  final prefs = await SharedPreferences.getInstance();
  String? homeId = prefs.getString('homeId');
  if (homeId != null) {
    try {
      final query = await FirebaseFirestore.instance
          .collection('homes')
          .where('home_id', isEqualTo: homeId)
          .get();
      
      if (query.docs.isNotEmpty) {
        await query.docs.first.reference.update({'fcmToken': token});
        debugPrint("FCM Token saved to Firestore for $homeId");
      }
    } catch (e) {
      debugPrint("Error saving FCM token: $e");
    }
  }
}

class GLFLMSApp extends StatelessWidget {
  final bool isLoggedIn;
  const GLFLMSApp({super.key, required this.isLoggedIn});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GL-FLMS',
      themeMode: ThemeMode.dark,
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0D0D14),
        fontFamily: 'Inter',
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFFF4D00),
          secondary: Color(0xFFFFC400),
          error: Color(0xFFEF4444),
          surface: Color(0xFF13131F),
        ),
      ),
      initialRoute: isLoggedIn ? '/dashboard' : '/welcome',
      routes: {
        '/welcome': (context) => const WelcomeScreen(),
        '/login': (context) => const LoginScreen(),
        '/dashboard': (context) => const MainNavScreen(),
      },
      debugShowCheckedModeBanner: false,
    );
  }
}
