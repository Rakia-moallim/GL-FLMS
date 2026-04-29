import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final TextEditingController _homeIdController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  bool emailAlerts = true;
  bool pushAlerts = true;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    String homeId = prefs.getString('homeId') ?? "100045";
    _homeIdController.text = homeId;

    try {
      // Load email from Firestore
      final query = await FirebaseFirestore.instance
          .collection('homes')
          .where('home_id', isEqualTo: homeId)
          .get();

      if (query.docs.isNotEmpty) {
        final data = query.docs.first.data();
        setState(() {
          _emailController.text = data['email'] ?? "";
          emailAlerts = data['email_alerts'] ?? true;
          pushAlerts = data['push_alerts'] ?? true;
        });
      }
    } catch (e) {
      debugPrint("Error loading Firestore settings: $e");
    }

    setState(() {
      isLoading = false;
    });
  }

  Future<void> _saveSettings() async {
    setState(() => isLoading = true);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('homeId', _homeIdController.text);

    try {
      // Save to Firestore
      final query = await FirebaseFirestore.instance
          .collection('homes')
          .where('home_id', isEqualTo: _homeIdController.text)
          .get();

      if (query.docs.isNotEmpty) {
        // Get current FCM token to ensure it's linked
        String? token = await FirebaseMessaging.instance.getToken();

        await query.docs.first.reference.update({
          'email': _emailController.text,
          'email_alerts': emailAlerts,
          'push_alerts': pushAlerts,
          'fcmToken': token,
        });
      } else {
        // If home doesn't exist in Firestore yet, create it
        String? token = await FirebaseMessaging.instance.getToken();
        await FirebaseFirestore.instance.collection('homes').add({
          'home_id': _homeIdController.text,
          'email': _emailController.text,
          'email_alerts': emailAlerts,
          'push_alerts': pushAlerts,
          'fcmToken': token,
          'registration_date': FieldValue.serverTimestamp(),
          'status': 'active',
          'address': 'Pending Setup'
        });
        debugPrint("Created new home record for ${_homeIdController.text}");
      }
    } catch (e) {
      debugPrint("Error saving Firestore settings: $e");
    }

    setState(() => isLoading = false);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Settings saved successfully!'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isLoggedIn', false);
    if (mounted) {
      Navigator.of(context).pushNamedAndRemoveUntil('/welcome', (route) => false);
    }
  }

  Future<void> _sendTestNotification() async {
    setState(() => isLoading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      String? homeId = prefs.getString('homeId');
      
      if (homeId == null) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Please save a Home ID first")));
        return;
      }

      // Create a test alert in RTDB to trigger the Cloud Function
      final alertRef = FirebaseDatabase.instance.ref("alerts").push();
      await alertRef.set({
        'type': 'Test',
        'desc': 'System Check: Push notifications are working correctly!',
        'homeId': homeId,
        'timestamp': DateTime.now().toIso8601String(),
        'status': 'Test'
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Test alert triggered! Check your notifications.'), backgroundColor: Colors.blue),
      );
    } catch (e) {
      debugPrint("Test notification failed: $e");
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e")));
    } finally {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: false,
        title: const Text(
          'SETTINGS',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: Stack(
        children: [
          SafeArea(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : ListView(
                    padding: const EdgeInsets.all(20),
                    children: [
                      _buildSectionHeader('General Configuration'),
                      const SizedBox(height: 16),
                      _buildGlassCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'HOME ID',
                              style: TextStyle(color: Colors.white54, fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: _homeIdController,
                              style: const TextStyle(color: Colors.white),
                              decoration: InputDecoration(
                                hintText: 'Enter your 6-digit Home ID',
                                hintStyle: const TextStyle(color: Colors.white24),
                                filled: true,
                                fillColor: Colors.white.withOpacity(0.05),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide.none,
                                ),
                                prefixIcon: const Icon(Icons.home_outlined, color: Colors.white54),
                              ),
                              keyboardType: TextInputType.number,
                            ),
                            const SizedBox(height: 24),
                            const Text(
                              'NOTIFICATION EMAIL',
                              style: TextStyle(color: Colors.white54, fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: _emailController,
                              style: const TextStyle(color: Colors.white),
                              decoration: InputDecoration(
                                hintText: 'Enter email for alerts',
                                hintStyle: const TextStyle(color: Colors.white24),
                                filled: true,
                                fillColor: Colors.white.withOpacity(0.05),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide.none,
                                ),
                                prefixIcon: const Icon(Icons.email_outlined, color: Colors.white54),
                              ),
                              keyboardType: TextInputType.emailAddress,
                            ),
                            const SizedBox(height: 24),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: isLoading ? null : _saveSettings,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFFFF4D00),
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  elevation: 0,
                                ),
                                child: isLoading 
                                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                  : const Text('SAVE CONFIGURATIONS', style: TextStyle(fontWeight: FontWeight.bold)),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 32),
                      _buildSectionHeader('System & Account'),
                      const SizedBox(height: 16),
                      _buildGlassCard(
                        child: Column(
                          children: [
                            _buildSettingItem(
                              icon: Icons.alternate_email_rounded,
                              title: 'Email Alerts',
                              trailing: Switch(
                                value: emailAlerts,
                                onChanged: (v) {
                                  setState(() => emailAlerts = v);
                                },
                                activeColor: const Color(0xFFFF4D00),
                              ),
                            ),
                            const Divider(color: Colors.white10, height: 32),
                            _buildSettingItem(
                              icon: Icons.notifications_active_outlined,
                              title: 'Push Notifications',
                              trailing: Switch(
                                value: pushAlerts,
                                onChanged: (v) {
                                  setState(() => pushAlerts = v);
                                },
                                activeColor: const Color(0xFFFF4D00),
                              ),
                            ),
                            const Divider(color: Colors.white10, height: 32),
                            _buildSettingItem(
                              icon: Icons.security_outlined,
                              title: 'Privacy Policy',
                              trailing: const Icon(Icons.chevron_right, color: Colors.white24),
                            ),
                            const Divider(color: Colors.white10, height: 32),
                            _buildSettingItem(
                              icon: Icons.info_outline,
                              title: 'App Version',
                              trailing: const Text('1.0.0 (Build 1)', style: TextStyle(color: Colors.white24, fontSize: 12)),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      _buildGlassCard(
                        child: _buildSettingItem(
                          icon: Icons.send_rounded,
                          title: 'Test Notification',
                          trailing: TextButton(
                            onPressed: isLoading ? null : _sendTestNotification,
                            child: const Text('SEND TEST', style: TextStyle(color: Color(0xFFFF4D00), fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ),
                      const SizedBox(height: 40),
                      TextButton.icon(
                        onPressed: _logout,
                        icon: const Icon(Icons.logout, color: Colors.redAccent),
                        label: const Text('LOGOUT ACCOUNT', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(color: Colors.redAccent.withOpacity(0.3)),
                          ),
                        ),
                      ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title.toUpperCase(),
      style: const TextStyle(
        color: Color(0xFFFFC400),
        fontWeight: FontWeight.bold,
        fontSize: 11,
        letterSpacing: 1.5,
      ),
    );
  }

  Widget _buildGlassCard({required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A24),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: child,
    );
  }

  Widget _buildSettingItem({required IconData icon, required String title, required Widget trailing}) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: Colors.white70, size: 20),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Text(
            title,
            style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w500),
          ),
        ),
        trailing,
      ],
    );
  }
}
