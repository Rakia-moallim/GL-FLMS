import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:shared_preferences/shared_preferences.dart';
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
    
  } catch (e) {
    debugPrint("Firebase init error: $e");
  }

  // Check login state
  final prefs = await SharedPreferences.getInstance();
  final bool isLoggedIn = prefs.getBool('isLoggedIn') ?? false;

  runApp(GLFLMSApp(isLoggedIn: isLoggedIn));
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
