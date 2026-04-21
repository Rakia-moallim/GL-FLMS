GL&FLMS – Gas Leakage & Flame Detection System.


#Abstract

GL&FLMS is an end-to-end IoT-based safety system designed to detect gas leakage and flame incidents and trigger immediate alerts. The system integrates ESP32-based embedded firmware with a web dashboard and a mobile application. It uses Firebase Realtime Database for real-time data exchange, alert handling, and system state synchronization. The mobile application is dedicated to delivering instant user alerts.

#Overview

This system combines hardware sensing and cloud-based communication to ensure fast detection and response to hazardous conditions. The ESP32 collects data from sensors and processes it locally. When a risk is detected, alerts are triggered on-device and sent to connected applications through the cloud backend.

#The system provides:

Local alerting (buzzer, LED, LCD display)

Remote alerts via mobile application

Web-based system interface


#Objectives

Detect gas leakage and flame presence in real time

Trigger immediate local alerts

Send real-time alerts to users via mobile application

Provide system status through web dashboard

Maintain synchronized system state using cloud database


#Features

Gas leakage detection using MQ-2 sensor

Flame detection system

Instant alert system (buzzer and LEDs)

On-device display using 20x4 I2C LCD

Web dashboard for system interaction

Mobile application for real-time user alerts

Cloud integration using Firebase Realtime Database


#System Architecture

ESP32 reads data from gas and flame sensors

Data is processed and sent to Firebase Realtime Database

Web dashboard retrieves system status

Mobile application receives alerts instantly

Local alerts are triggered simultaneously on hardware


#Tech Stack

Hardware

ESP32 Development Board

MQ-2 Gas Sensor

Flame Sensor

20x4 I2C LCD

Buzzer

LED indicators


#Software

Embedded C++ using Arduino IDE

Web Dashboard (frontend interface for system control)

Mobile Application (user alert system)

Firebase Realtime Database



#Project Structure

/firmware → ESP32 embedded code

/web → Web dashboard application

/mobile → Mobile alert application


#Setup Instructions

1. Firmware Setup (ESP32)
Install Arduino IDE
Add ESP32 board package
Install required libraries (MQ2, LCD I2C, Firebase client)
Configure Wi-Fi credentials
Configure Firebase credentials
Upload firmware to ESP32
2. Firebase Setup
Create project in Firebase Realtime Database
Enable Realtime Database
Set rules (test mode for development)
Copy configuration into firmware, web, and mobile apps
3. Web Dashboard
Navigate to /web directory
Install dependencies
Add Firebase configuration
Run application
4. Mobile Application
Navigate to /mobile directory
Install dependencies
Configure Firebase
Run on emulator or device
Receives real-time user alerts


#Usage

Power on ESP32 system

Sensors continuously detect gas and flame conditions

If hazard detected:
Buzzer and LED activate

Message displayed on 20x4 I2C LCD

Data sent to Firebase Realtime Database

Mobile app receives alert notification

Web dashboard updates system status


#Results

The system successfully detects gas leakage and flame conditions and triggers immediate multi-layer alerts. The integration of cloud services ensures fast communication between hardware and user interfaces.

#Future Improvements

Push notification integration

Automatic gas valve shutdown system

AI-based detection enhancement

Data logging and analytics dashboard

Offline fallback mode




Contributors

Ilhaan Ali Dirie

Ismail Mohmed Mahmud

Rakia Moallim
