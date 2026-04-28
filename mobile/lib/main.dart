import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:percent_indicator/percent_indicator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'screens/welcome_screen.dart';
import 'screens/login_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase with the provided web credentials.
  // This will work across Android and iOS for Realtime Database
  // if you strictly use Realtime Database and no native-specific services.
  try {
    await Firebase.initializeApp(
      options: const FirebaseOptions(
        apiKey: 'AIzaSyCOxDVTNHq9rDOC-AbglipGuHrv0aYvnc0',
        appId: '1:206275229351:android:ac600f712bb96d26c60d82', // Note: User provided web appId, but I'll use the relevant part or keep web if they intended cross-platform web-init
        messagingSenderId: '206275229351',
        projectId: 'koor-mission-control',
        databaseURL: 'https://koor-mission-control-default-rtdb.firebaseio.com',
        storageBucket: 'koor-mission-control.firebasestorage.app',
      ),
    );
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
        '/dashboard': (context) => const DashboardScreen(),
      },
      debugShowCheckedModeBanner: false,
    );
  }
}

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  DatabaseReference? _sensorRef;
  String? homeId;
  
  int gas = 0;
  bool flame = false;
  bool alarm = false;
  bool isConnected = false;

  @override
  void initState() {
    super.initState();
    _initializeData();
  }

  Future<void> _initializeData() async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    homeId = prefs.getString('homeId') ?? "100045"; // Default placeholder if missing
    
    _sensorRef = FirebaseDatabase.instance.ref('status/$homeId/sensors');
    
    _sensorRef!.onValue.listen((event) {
      if (event.snapshot.value != null) {
        final data = Map<String, dynamic>.from(event.snapshot.value as Map);
        setState(() {
          gas = (data['gas'] ?? 0) as int;
          flame = (data['flame'] ?? false) as bool;
          alarm = (data['alarm'] ?? false) as bool;
          isConnected = true;
        });
      }
    }, onError: (error) {
      setState(() => isConnected = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFFF6D00), Color(0xFFFFC400)],
                ),
                borderRadius: BorderRadius.circular(12),
                boxShadow: alarm ? [
                  BoxShadow(color: const Color(0xFFFF6D00).withOpacity(0.6), blurRadius: 16)
                ] : [],
              ),
              child: const Text('🔥', style: TextStyle(fontSize: 20)),
            )
            .animate(target: alarm ? 1 : 0)
            .shake(duration: 500.ms, hz: 6),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'KOOR',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                ),
                Row(
                  children: [
                    Container(
                      width: 8, height: 8,
                      decoration: BoxDecoration(
                        color: isConnected ? Colors.green : Colors.grey,
                        shape: BoxShape.circle,
                      ),
                    ).animate(onPlay: (controller) => controller.repeat())
                     .fade(duration: 1.seconds, begin: 0.3, end: 1.0),
                    const SizedBox(width: 6),
                    Text(
                      isConnected ? 'LIVE' : 'OFFLINE',
                      style: TextStyle(
                        fontSize: 10,
                        color: isConnected ? Colors.green : Colors.grey,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
      body: Stack(
        children: [
          // Background Gradient effect
          Positioned(
            top: -100, left: -100,
            child: Container(
              width: 300, height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFFFF6D00).withOpacity(0.1),
              ),
            ).animate(onPlay: (controller) => controller.repeat())
             .scale(duration: 4.seconds, begin: const Offset(0.9, 0.9), end: const Offset(1.2, 1.2)),
          ),
          
          SafeArea(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              children: [
                // ALARM BANNER
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 300),
                  child: alarm ? _buildAlarmBanner() : const SizedBox.shrink(),
                ),
                const SizedBox(height: 20),
                
                // GAS GAUGE
                _buildGasCard(),
                const SizedBox(height: 20),
                
                // FLAME CARD
                _buildFlameCard(),
                const SizedBox(height: 20),
                
                // SYSTEM PANEL
                _buildSystemPanel(),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAlarmBanner() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.redAccent.withOpacity(0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.redAccent.withOpacity(0.5)),
        boxShadow: [
          BoxShadow(
            color: Colors.redAccent.withOpacity(0.2),
            blurRadius: 20,
            spreadRadius: 2,
          )
        ]
      ),
      child: Row(
        children: [
          const Icon(Icons.warning_amber_rounded, color: Colors.redAccent, size: 36),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'EMERGENCY ALERT',
                  style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 16),
                ),
                Text(
                  gas > 60 && flame ? 'Gas Leakage & Fire Detected!' : (gas > 60 ? 'High Gas Concentration!' : 'Flame Detected!'),
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate(onPlay: (controller) => controller.repeat(reverse: true))
     .shimmer(duration: 1.seconds, color: Colors.redAccent.withOpacity(0.4));
  }

  Widget _buildGasCard() {
    Color gasColor = gas > 60 ? Colors.redAccent : (gas > 35 ? Colors.orange : Colors.green);
    
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A24),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: gasColor.withOpacity(0.3)),
        boxShadow: alarm ? [BoxShadow(color: gasColor.withOpacity(0.15), blurRadius: 24)] : [],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('GAS CONCENTRATION', style: TextStyle(color: Colors.white54, fontSize: 12, fontWeight: FontWeight.bold)),
          const SizedBox(height: 30),
          Center(
            child: CircularPercentIndicator(
              radius: 100.0,
              lineWidth: 18.0,
              animation: true,
              animateFromLastPercent: true,
              percent: (gas / 100).clamp(0.0, 1.0),
              circularStrokeCap: CircularStrokeCap.round,
              backgroundColor: Colors.white10,
              progressColor: gasColor,
              center: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    "$gas%",
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 42, color: gasColor),
                  ),
                  const Text('LEVEL', style: TextStyle(color: Colors.white54, fontSize: 10)),
                ],
              ),
            ),
          ).animate(target: gas > 60 ? 1 : 0)
           .scale(duration: 400.ms, curve: Curves.easeInOut),
          const SizedBox(height: 30),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Threshold: 60%', style: TextStyle(color: Colors.white54, fontSize: 12)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: gasColor.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  gas > 60 ? 'DANGER' : (gas > 35 ? 'WARNING' : 'SAFE'),
                  style: TextStyle(color: gasColor, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFlameCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A24),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: flame ? Colors.redAccent.withOpacity(0.4) : Colors.green.withOpacity(0.2)),
        boxShadow: flame ? [BoxShadow(color: Colors.redAccent.withOpacity(0.15), blurRadius: 24)] : [],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('FLAME SENSOR', style: TextStyle(color: Colors.white54, fontSize: 12, fontWeight: FontWeight.bold)),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 50, height: 50,
                    decoration: BoxDecoration(
                      color: flame ? Colors.redAccent.withOpacity(0.2) : Colors.green.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(flame ? '🔥' : '✅', style: const TextStyle(fontSize: 24)),
                    ),
                  ).animate(target: flame ? 1 : 0)
                   .scale(duration: 300.ms, curve: Curves.easeOutBack),
                   const SizedBox(width: 16),
                   Column(
                     crossAxisAlignment: CrossAxisAlignment.start,
                     children: [
                       Text(
                         flame ? 'DETECTED' : 'CLEAR',
                         style: TextStyle(
                           color: flame ? Colors.redAccent : Colors.green,
                           fontWeight: FontWeight.bold,
                           fontSize: 20,
                         ),
                       ),
                       const SizedBox(height: 4),
                       Text(
                         flame ? 'Fire hazard present' : 'No flame detected',
                         style: const TextStyle(color: Colors.white54, fontSize: 12),
                       ),
                     ],
                   ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSystemPanel() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A24),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('SYSTEM STATUS', style: TextStyle(color: Colors.white54, fontSize: 12, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          _buildStatusRow('Connection', isConnected ? 'Online' : 'Offline', isConnected),
          const SizedBox(height: 12),
          _buildStatusRow('Alarm State', alarm ? 'Triggered' : 'Standby', !alarm),
        ],
      ),
    );
  }

  Widget _buildStatusRow(String label, String value, bool isOk) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Colors.white70)),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: isOk ? Colors.green.withOpacity(0.1) : Colors.redAccent.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            value,
            style: TextStyle(color: isOk ? Colors.green : Colors.redAccent, fontSize: 11, fontWeight: FontWeight.bold),
          ),
        ),
      ],
    );
  }
}
