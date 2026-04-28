

/*
  KOOR — Gas Leakage & Flame Detection System
  ESP32 Firmware v2.0
  Extended: WiFi + Firebase Realtime Database
*/

#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <time.h>

// Required Firebase addon helpers
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// ─── WiFi Credentials ─────────
#define WIFI_SSID     "Moallim"
#define WIFI_PASSWORD "password"

// ─── Home Configuration ─────────────
String homeID = "100045";  // Default fallback ID
String deviceMAC = "";     // Will be fetched at boot


// ─── Firebase Credentials ──────────
#define API_KEY      "AIzaSyCOxDVTNHq9rDOC-AbglipGuHrv0aYvnc0"
#define DATABASE_URL "https://koor-mission-control-default-rtdb.firebaseio.com"
#define DATABASE_SECRET "kmNkcGGgcv0E3LxnerbDhYeeckXPdsPYe1GsYrQu"

// ─── Firebase Objects ─────
FirebaseData   fbdo;
FirebaseAuth   auth;
FirebaseConfig firebaseConfig;

// ─── LCD ──────────
LiquidCrystal_I2C lcd(0x27, 20, 4);

// ─── Output Pins ───────
#define BUZZER_PIN  25
#define GREEN_LED   26
#define RED_LED     27

// ─── Input Pins ──────
#define GAS_SENSOR   34
#define FLAME_SENSOR 35

// ─── Config ─────
int gasThreshold      = 60;    // Default % above which gas alarm triggers (synced from DB)
#define SEND_INTERVAL   5000   // ms between Firebase pushes
#define SYNC_INTERVAL   30000  // ms between settings sync

// ─── State ───
bool firebaseReady    = false;
bool lastAlarmState   = false;
unsigned long lastSendMs = 0;
unsigned long lastSyncMs = 0;
unsigned long lastLcdMs  = 0;

// ─── Dynamic Config ──────────────────
void syncSettings() {
  if (!firebaseReady) return;
  
  Serial.println("[Config] Syncing settings from RTDB...");
  if (Firebase.RTDB.getInt(&fbdo, "/settings/global/gasThreshold")) {
    if (fbdo.dataType() == "int") {
      gasThreshold = fbdo.intData();
      Serial.print("[Config] Updated Gas Threshold: ");
      Serial.println(gasThreshold);
    }
  } else {
    Serial.print("[Config] Sync failed: ");
    Serial.println(fbdo.errorReason());
  }
}


void connectWiFi() {
  Serial.print("[WiFi] Connecting to: ");
  Serial.println(WIFI_SSID);

  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi ");
  lcd.setCursor(0, 1);
  lcd.print("                ");

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println("\n[WiFi] Connected!");

  // ─── 5. SYNC TIME (REQUIRED FOR SSL) ───
  lcd.setCursor(0, 0); lcd.print("Syncing Time... ");
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  time_t now = time(nullptr);
  while (now < 8 * 3600 * 2) {
    delay(500);
    Serial.print(".");
    now = time(nullptr);
  }
  Serial.println("\n[Time] Sync Complete");

  // ─── 6. FIREBASE INIT ───
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("[WiFi] Connected — IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("[WiFi] FAILED — running offline");
  }
}

// 
void initFirebase() {
  firebaseConfig.database_url = DATABASE_URL;
  firebaseConfig.signer.tokens.legacy_token = DATABASE_SECRET;

  Serial.println("[Firebase] Initializing with Legacy Token...");
  
  Firebase.begin(&firebaseConfig, &auth);
  Firebase.reconnectWiFi(true);
  
  firebaseReady = true; 
  Serial.println("[Firebase] System Ready.");
}

// ─── Dynamic Config ──────────────────
void syncHomeID() {
  if (!firebaseReady) return;

  String cleanMAC = deviceMAC;
  cleanMAC.replace(":", "");
  cleanMAC.toUpperCase();
  
  Serial.print("[Config] Fetching Home ID for: ");
  Serial.println(cleanMAC);
  
  lcd.setCursor(0, 0); lcd.print("Syncing ID...   ");
  lcd.setCursor(0, 1); lcd.print(deviceMAC);

  String path = "/devices/" + cleanMAC + "/home_id";
  if (Firebase.RTDB.getString(&fbdo, path.c_str())) {
    if (fbdo.dataType() == "string") {
      homeID = fbdo.stringData();
      Serial.print("[Config] New Home ID: ");
      Serial.println(homeID);
    } else {
      Serial.println("[Config] No ID assigned — using default");
    }
  } else {
    Serial.print("[Config] Fetch failed: ");
    Serial.println(fbdo.errorReason());
  }
}

// ─── Alert Persistence ────────────────
void logAlertToFirestore(String type, String desc) {
  if (!firebaseReady) return;

  Serial.println("[Alert] Recording incident to Database...");
  
  // Get current time for the record
  time_t now = time(nullptr);
  struct tm timeinfo;
  gmtime_r(&now, &timeinfo);
  char timestamp[25];
  strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);

  FirebaseJson content;
  content.set("timestamp", String(timestamp));
  content.set("type", type);
  content.set("source", "Node 01");
  content.set("desc", desc);
  content.set("status", "Resolved");

  // Generate a unique ID based on timestamp
  String alertId = "alert_" + String(now);
  String path = "/alerts/" + alertId;

  if (Firebase.RTDB.setJSON(&fbdo, path.c_str(), &content)) {
    Serial.println("[Alert] ✓ Incident recorded permanently in RTDB");
  } else {
    Serial.print("[Alert] ✗ Failed to record: ");
    Serial.println(fbdo.errorReason());
  }
}

// ────────────────────
void setup() {
  Serial.begin(115200);

  // ─── 1. INITIALIZE WIFI RADIO (REQUIRED TO READ MAC) ───
  WiFi.mode(WIFI_STA);
  delay(100);

  // ─── 2. FETCH MAC ADDRESS ───
  deviceMAC = WiFi.macAddress();
  String cleanMAC = deviceMAC;
  cleanMAC.replace(":", "");
  cleanMAC.toUpperCase();

  // ─── 2. INITIALIZE LCD ───
  // I2C + LCD init
  Wire.begin(21, 22);
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0); lcd.print("DEVICE ID:");
  lcd.setCursor(0, 1); lcd.print(cleanMAC);

  Serial.println("\n==============================");
  Serial.print("ESP32 MAC: "); Serial.println(deviceMAC);
  Serial.print("CLEAN ID:  "); Serial.println(cleanMAC);
  Serial.println("==============================\n");

  delay(3000); // Pause so you can read the ID

  // ─── 3. SENSORS & BUZZER ───
  // Pin modes
  pinMode(BUZZER_PIN,  OUTPUT);
  pinMode(GREEN_LED,   OUTPUT);
  pinMode(RED_LED,     OUTPUT);
  pinMode(GAS_SENSOR,  INPUT);
  pinMode(FLAME_SENSOR, INPUT);

  // Initial safe state
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED,   LOW);
  noTone(BUZZER_PIN);

  // Splash
  lcd.setCursor(0, 0); lcd.print("Gas+Flame System");
  lcd.setCursor(0, 1); lcd.print("  Initializing  ");
  delay(1500);
  lcd.clear();

  // Connect WiFi
  connectWiFi();
  delay(500);
  lcd.clear();

  // Init Firebase (only if WiFi connected)
  if (WiFi.status() == WL_CONNECTED) {
    lcd.setCursor(0, 0); lcd.print("Firebase Init...");
    initFirebase();
    delay(1000);
    syncHomeID();    // ← Fetch the dynamic Home ID
    syncSettings();  // ← Fetch thresholds
    delay(1000);
    lcd.clear();
    Serial.println("[Firebase] Init complete");
  } else {
    Serial.println("[Firebase] Skipped — no WiFi");
  }

  Serial.println("[System] Ready — entering main loop");
}

//
void loop() {
  unsigned long now = millis();

  // ── 1. Read Sensors ───────────────────────
  int rawGas     = analogRead(GAS_SENSOR);
  int gasPercent = map(rawGas, 0, 4095, 0, 100);
  gasPercent     = constrain(gasPercent, 0, 100);

  int  flameRaw     = digitalRead(FLAME_SENSOR);
  bool flameDetected = (flameRaw == LOW);  // LOW = flame present

  bool gasHigh = (gasPercent > gasThreshold);
  bool alarm   = gasHigh || flameDetected;

  // ── 2. Detection Tracking (Firestore Persistence) ──
  if (alarm && !lastAlarmState) {
    // Alarm just triggered
    String type = flameDetected ? "Critical" : "Warning";
    String desc = flameDetected ? "FLAME DETECTED in Kitchen" : "High Gas Level: " + String(gasPercent) + "%";
    logAlertToFirestore(type, desc);
  }
  lastAlarmState = alarm;

  // ── 3. Serial Debug ──────────────────
  if (now - lastSendMs >= SEND_INTERVAL) {
     Serial.printf("[Sensor] Gas: %d%% (Thr: %d%%) | Flame: %s | Alarm: %s\n",
      gasPercent,
      gasThreshold,
      flameDetected ? "YES" : "NO",
      alarm         ? "ON"  : "OFF");
  }

  // ── 4. LCD Update ────────────────────────
  bool wifiOk = (WiFi.status() == WL_CONNECTED);

  lcd.setCursor(0, 0);
  lcd.print(wifiOk && firebaseReady ? "Cloud: CONNECTED" : "Cloud: OFFLINE  ");

  lcd.setCursor(0, 1);
  lcd.print("Gas: ");
  lcd.print(gasPercent);
  lcd.print("%        ");

  lcd.setCursor(0, 2);
  lcd.print("Flame: ");
  lcd.print(flameDetected ? "YES    " : "NO     ");

  lcd.setCursor(0, 3);
  if (alarm) {
    if (gasHigh && flameDetected) lcd.print("!! GAS + FIRE !!"); 
    else if (gasHigh)             lcd.print("!! GAS DANGER !!");
    else                          lcd.print("!! FLAME DETCT !!");
  } else {
    lcd.print("Status: SAFE    ");
  }

  // ── 5. Local Alerts (Buzzer + LEDs) 
  if (alarm) {
    digitalWrite(GREEN_LED, LOW);
    digitalWrite(RED_LED,   HIGH);
    tone(BUZZER_PIN, 2500);
  } else {
    digitalWrite(GREEN_LED, HIGH);
    digitalWrite(RED_LED,   LOW);
    noTone(BUZZER_PIN);
  }

  // ── 6. Firebase Push & Settings Sync
  if (now - lastSendMs >= SEND_INTERVAL) {
    lastSendMs = now;

    if (!wifiOk) {
      Serial.println("[WiFi] Dropped — reconnecting...");
      WiFi.reconnect();
    }

    if (firebaseReady) {
      FirebaseJson json;
      json.set("gas",   gasPercent);
      json.set("flame", flameDetected);
      json.set("alarm", alarm);

      String path = "/status/" + homeID + "/sensors";
      Firebase.RTDB.setJSON(&fbdo, path.c_str(), &json);
    }
  }

  // Periodic Settings Sync
  if (now - lastSyncMs >= SYNC_INTERVAL) {
    lastSyncMs = now;
    syncSettings();
  }

  delay(300); // Small yield
}






