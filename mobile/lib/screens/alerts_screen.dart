import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';

class AlertsScreen extends StatefulWidget {
  const AlertsScreen({super.key});

  @override
  State<AlertsScreen> createState() => _AlertsScreenState();
}

class _AlertsScreenState extends State<AlertsScreen> {
  DatabaseReference? _alertsRef;
  List<Map<String, dynamic>> alerts = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchAlerts();
  }

  void _fetchAlerts() {
    _alertsRef = FirebaseDatabase.instance.ref('alerts');

    _alertsRef!.onValue.listen((event) {
      if (event.snapshot.value != null) {
        final data = Map<String, dynamic>.from(event.snapshot.value as Map);
        final List<Map<String, dynamic>> loadedAlerts = [];
        
        data.forEach((key, value) {
          loadedAlerts.add({
            'id': key,
            ...Map<String, dynamic>.from(value as Map),
          });
        });

        // Sort by timestamp descending
        loadedAlerts.sort((a, b) {
          final tsA = DateTime.tryParse(a['timestamp'] ?? '') ?? DateTime.now();
          final tsB = DateTime.tryParse(b['timestamp'] ?? '') ?? DateTime.now();
          return tsB.compareTo(tsA);
        });

        if (mounted) {
          setState(() {
            alerts = loadedAlerts;
            isLoading = false;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            alerts = [];
            isLoading = false;
          });
        }
      }
    }, onError: (error) {
      debugPrint("Alerts Listener Error: $error");
      if (mounted) setState(() => isLoading = false);
    });
  }

  String _formatTimestamp(String? ts) {
    if (ts == null) return "—";
    try {
      final date = DateTime.parse(ts);
      return DateFormat('MMM dd, yyyy • hh:mm a').format(date);
    } catch (e) {
      return ts;
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
          'ALERT HISTORY',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: Stack(
        children: [
          // Background Glow
          Positioned(
            top: 200, right: -100,
            child: Container(
              width: 300, height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFFEF4444).withOpacity(0.05),
              ),
            ),
          ),
          
          SafeArea(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : alerts.isEmpty
                    ? _buildEmptyState()
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                        itemCount: alerts.length,
                        itemBuilder: (context, index) {
                          final alert = alerts[index];
                          return _buildAlertCard(alert, index);
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.history_toggle_off_rounded, size: 64, color: Colors.white24),
          const SizedBox(height: 16),
          Text(
            'No alert history found',
            style: TextStyle(color: Colors.white54, fontSize: 16),
          ),
        ],
      ),
    );
  }

  Widget _buildAlertCard(Map<String, dynamic> alert, int index) {
    final type = alert['type'] ?? 'Warning';
    final isCritical = type == 'Critical';
    final color = isCritical ? const Color(0xFFEF4444) : const Color(0xFFF59E0B);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A24),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  type.toUpperCase(),
                  style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.bold,
                    fontSize: 10,
                    letterSpacing: 1.2,
                  ),
                ),
              ),
              Text(
                _formatTimestamp(alert['timestamp']),
                style: const TextStyle(color: Colors.white24, fontSize: 11),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            alert['source'] ?? 'Unknown Source',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            alert['desc'] ?? 'No description available',
            style: const TextStyle(color: Colors.white60, fontSize: 13),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(Icons.check_circle_outline, size: 14, color: Colors.greenAccent),
              const SizedBox(width: 6),
              Text(
                alert['status'] ?? 'Active',
                style: const TextStyle(
                  color: Colors.greenAccent,
                  fontWeight: FontWeight.bold,
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(delay: (50 * index).ms).slideX(begin: 0.1);
  }
}
