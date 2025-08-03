# GPS Tracking System - Hardware Setup Guide

## 🔧 Required Hardware Components

### Core Components
1. **Arduino Board**: Arduino Uno/Nano/ESP32
2. **GPS Module**: NEO-6M or NEO-8M (recommended)
3. **GSM Module**: SIM800L or SIM7600 for cellular connectivity
4. **MicroSD Card Module**: For offline data storage
5. **Battery**: Li-ion 3.7V or power bank
6. **Breadboard/PCB**: For connections
7. **Jumper Wires**: Male-to-male, male-to-female
8. **SIM Card**: With data plan

### Optional Components
- **Enclosure**: Waterproof case for outdoor use
- **Antenna**: External GPS/GSM antennas for better reception
- **Voltage Regulator**: 3.3V regulator for stable power
- **LED Indicators**: Status lights
- **Buzzer**: Audio alerts

## 📋 Wiring Diagram

### Arduino Uno + NEO-6M + SIM800L Setup

```
Arduino Uno    NEO-6M GPS     SIM800L GSM    SD Card Module
-----------    ----------     -----------    --------------
VCC (5V)   --- VCC            VCC            VCC
GND        --- GND            GND            GND
Pin 4      --- TX             -              -
Pin 3      --- RX             -              -
Pin 7      --- -              TX             -
Pin 8      --- -              RX             -
Pin 10     --- -              -              CS
Pin 11     --- -              -              MOSI
Pin 12     --- -              -              MISO
Pin 13     --- -              -              SCK
```

### ESP32 Setup (Alternative)
```
ESP32          NEO-6M GPS     SIM800L GSM    
------         ----------     -----------    
3.3V       --- VCC            VCC            
GND        --- GND            GND            
GPIO16     --- TX             -              
GPIO17     --- RX             -              
GPIO26     --- -              TX             
GPIO27     --- -              RX             
```

## 💻 Arduino Code Configuration

The Arduino firmware is already created in `/arduino/gps_tracker.ino`. Key features:

### 1. **GPS Tracking**
```cpp
// GPS coordinates are read every 30 seconds
// Automatic fallback to backup GPS modules
// Speed and heading calculation
```

### 2. **GSM Communication**
```cpp
// Sends data to server via HTTP POST
// SMS backup for emergencies
// MQTT support for real-time updates
```

### 3. **Offline Storage**
```cpp
// Stores GPS data on SD card when offline
// Automatic sync when connection restored
// Data compression to save space
```

### 4. **Battery Management**
```cpp
// Monitors battery voltage
// Low power sleep modes
// Battery alerts via GSM
```

## 🔌 Installation Steps

### Step 1: Hardware Assembly
1. Connect components according to wiring diagram
2. Insert programmed SIM card with data plan
3. Test all connections with multimeter
4. Install in weatherproof enclosure

### Step 2: Arduino Programming
1. Open Arduino IDE
2. Install required libraries:
   ```
   - SoftwareSerial
   - TinyGPS++
   - SD
   - ArduinoJson
   ```
3. Upload the firmware from `/arduino/gps_tracker.ino`
4. Configure WiFi/APN settings in code

### Step 3: Server Setup
1. Start the backend server:
   ```bash
   cd "/Users/new/Tracking QRCode"
   npm run dev
   ```
2. Configure API endpoint in device settings
3. Test connection with device

### Step 4: Device Registration
1. Open GPS Tracking Dashboard
2. Go to Settings → Device Configuration
3. Add new device with unique ID
4. Test real-time updates

## 📱 Real-Time Tracking Setup

### 1. **Configure Update Intervals**
- **High Accuracy**: 10-30 seconds (more battery usage)
- **Balanced**: 1-2 minutes (recommended)
- **Battery Saver**: 5-10 minutes

### 2. **Set Up Geofencing**
```javascript
// Dashboard automatically creates alerts when devices
// enter/exit predefined areas
```

### 3. **Enable Live Notifications**
- Battery low warnings
- Device offline alerts
- Speed limit notifications
- Geofence violations

## 🌐 Data Flow Architecture

```
GPS Device → GSM/WiFi → Backend Server → WebSocket → Dashboard
     ↓
  SD Card Storage (offline backup)
```

### Real-Time Updates:
1. Device collects GPS coordinates
2. Sends via HTTP POST to `/api/locations`
3. Server broadcasts via WebSocket
4. Dashboard updates map in real-time
5. Click device on map for detailed info

## 🔧 Troubleshooting

### GPS Not Working
- Check antenna connection
- Wait 2-5 minutes for GPS lock
- Ensure clear sky view
- Verify wiring connections

### GSM Connection Issues
- Check SIM card activation
- Verify APN settings
- Ensure good cellular coverage
- Check power supply stability

### Device Not Appearing
- Verify device ID matches dashboard
- Check server endpoint configuration
- Ensure backend server is running
- Check firewall/network settings

### Battery Draining Fast
- Increase update intervals
- Enable sleep mode in code
- Check for loose connections
- Use efficient power supply

## 📊 Dashboard Features

### Device Clicking
- **Click any device** on map or device list
- **Real-time details**: Battery, signal, location, speed
- **Live updates**: Data refreshes automatically
- **Map centering**: Click to focus on device location

### Settings Panel
- **API Configuration**: Server endpoints
- **Update Intervals**: How often devices report
- **Notifications**: Battery, offline, speed alerts
- **Map Settings**: Providers, zoom, trails

### Live Tracking
- **Real-time movement**: See devices move on map
- **Speed monitoring**: Current speed and heading
- **Trail history**: Path over time
- **Multi-device**: Track unlimited devices

## 🚀 Next Steps

1. **Add More Devices**: Repeat hardware setup for fleet tracking
2. **Mobile App**: Install React Native companion app
3. **Cloud Deploy**: Deploy to AWS/Heroku for remote access
4. **Advanced Features**: Geofencing, route optimization, reporting

Your GPS tracking system is now ready for real-world deployment! Each device will automatically appear on the dashboard and provide live location updates.
