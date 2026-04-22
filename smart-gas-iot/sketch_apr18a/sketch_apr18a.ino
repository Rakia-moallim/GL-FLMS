/*
  GL&FLMS — Gas Leakage & Flame Detection System
  ESP32 Firmware v2.0
  Extended: WiFi + Firebase Realtime Database
*/

#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>

// Required Firebase addon helpers
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// ─── WiFi Credentials ─────────────────────────────────────────────────────────
#define WIFI_SSID     "Rakia Moallim"
#define WIFI_PASSWORD "585690hassna"

// ─── Firebase Credentials ─────────────────────────────────────────────────────
#define API_KEY      "AIzaSyBDTB7F4rDu8yXh1RFsoECW27xw2In2xuo"
#define DATABASE_URL "https://gl-and-fms-default-rtdb.firebaseio.com"

// ─── Firebase Objects ─────────────────────────────────────────────────────────
FirebaseData   fbdo;
FirebaseAuth   auth;
FirebaseConfig firebaseConfig;

// ─── LCD ──────────────────────────────────────────────────────────────────────
LiquidCrystal_I2C lcd(0x27, 20, 4);

// ─── Output Pins ──────────────────────────────────────────────────────────────
#define BUZZER_PIN  25
#define GREEN_LED   26
#define RED_LED     27

// ─── Input Pins ───────────────────────────────────────────────────────────────
#define GAS_SENSOR   34
#define FLAME_SENSOR 35

// ─── Config ───────────────────────────────────────────────────────────────────
#define GAS_THRESHOLD   60     // % above which gas alarm triggers
#define SEND_INTERVAL   5000   // ms between Firebase pushes

// ─── State ────────────────────────────────────────────────────────────────────
bool firebaseReady    = false;
unsigned long lastSendMs = 0;
unsigned long lastLcdMs  = 0;

// ─────────────────────────────────────────────────────────────────────────────
void connectWiFi() {
  Serial.print("[WiFi] Connecting to: ");
  Serial.println(WIFI_SSID);

  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi ");
  lcd.setCursor(0, 1);
  lcd.print("                ");

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int dots = 0;
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(500);
    Serial.print(".");
    lcd.setCursor(dots % 16, 1);
    lcd.print(".");
    dots++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("[WiFi] Connected — IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("[WiFi] FAILED — running offline");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
void initFirebase() {
  firebaseConfig.api_key      = API_KEY;
  firebaseConfig.database_url = DATABASE_URL;

  // Anonymous sign-up (creates a temporary anonymous user)
  if (Firebase.signUp(&firebaseConfig, &auth, "", "")) {
    Serial.println("[Firebase] Anonymous auth OK");
    firebaseReady = true;
  } else {
    Serial.print("[Firebase] Auth error: ");
    Serial.println(firebaseConfig.signer.signupError.message.c_str());
    firebaseReady = false;
  }

  firebaseConfig.token_status_callback = tokenStatusCallback; // from TokenHelper
  Firebase.begin(&firebaseConfig, &auth);
  Firebase.reconnectWiFi(true);
}

// ─────────────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=== GL&FLMS Firmware v2.0 ===");

  // I2C + LCD init
  Wire.begin(21, 22);
  lcd.init();
  lcd.backlight();
  lcd.clear();

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
    lcd.clear();
    Serial.println("[Firebase] Init complete");
  } else {
    Serial.println("[Firebase] Skipped — no WiFi");
  }

  Serial.println("[System] Ready — entering main loop");
}

// ─────────────────────────────────────────────────────────────────────────────
void loop() {
  unsigned long now = millis();

  // ── 1. Read Sensors ─────────────────────────────────────────────────────────
  int rawGas     = analogRead(GAS_SENSOR);
  int gasPercent = map(rawGas, 0, 4095, 0, 100);
  gasPercent     = constrain(gasPercent, 0, 100);

  int  flameRaw     = digitalRead(FLAME_SENSOR);
  bool flameDetected = (flameRaw == LOW);  // LOW = flame present

  bool gasHigh = (gasPercent > GAS_THRESHOLD);
  bool alarm   = gasHigh || flameDetected;

  // ── 2. Serial Debug ─────────────────────────────────────────────────────────
  Serial.printf("[Sensor] Gas: %d%% | Flame: %s | Alarm: %s\n",
    gasPercent,
    flameDetected ? "YES" : "NO",
    alarm         ? "ON"  : "OFF");

  // ── 3. LCD Update ───────────────────────────────────────────────────────────
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

  // ── 4. Local Alerts (Buzzer + LEDs) ─────────────────────────────────────────
  if (alarm) {
    digitalWrite(GREEN_LED, LOW);
    digitalWrite(RED_LED,   HIGH);
    tone(BUZZER_PIN, 2500);
  } else {
    digitalWrite(GREEN_LED, HIGH);
    digitalWrite(RED_LED,   LOW);
    noTone(BUZZER_PIN);
  }

  // ── 5. Firebase Push (non-blocking, every SEND_INTERVAL ms) ─────────────────
  if (now - lastSendMs >= SEND_INTERVAL) {
    lastSendMs = now;

    // Reconnect WiFi if dropped
    if (!wifiOk) {
      Serial.println("[WiFi] Dropped — reconnecting...");
      WiFi.reconnect();
      delay(2000);
    }

    if (Firebase.ready() && firebaseReady) {
      FirebaseJson json;
      json.set("gas",   gasPercent);
      json.set("flame", flameDetected);
      json.set("alarm", alarm);

      Serial.println("[Firebase] Sending data...");
      if (Firebase.RTDB.setJSON(&fbdo, "/sensor", &json)) {
        Serial.println("[Firebase] ✓ Data sent successfully");
      } else {
        Serial.print("[Firebase] ✗ Error: ");
        Serial.println(fbdo.errorReason());
      }
    } else {
      Serial.println("[Firebase] Not ready — skipping push");
    }
  }

  delay(300); // Small yield — sensor polling at ~3Hz
}
