import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_animate/flutter_animate.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final TextEditingController _homeIdController = TextEditingController();
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _homeIdController.text = prefs.getString('homeId') ?? "100045";
      isLoading = false;
    });
  }

  Future<void> _saveSettings() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('homeId', _homeIdController.text);
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
                            const SizedBox(height: 20),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: _saveSettings,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFFFF4D00),
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  elevation: 0,
                                ),
                                child: const Text('SAVE CHANGES', style: TextStyle(fontWeight: FontWeight.bold)),
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
                              icon: Icons.notifications_active_outlined,
                              title: 'Push Notifications',
                              trailing: Switch(
                                value: true,
                                onChanged: (v) {},
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
