# Device Setup Guide - Add Devices to Monitor

## 🚀 Quick Summary of Current System

Your tracking system supports **4 types of devices**:
1. **Desktop Computers** (Windows, macOS, Linux) - Python agent
2. **Mobile Devices** (Android, iOS) - React Native app  
3. **GPS Hardware Trackers** - For vehicles/assets
4. **Custom IoT Devices** - Arduino/Raspberry Pi based

## ✅ Current Devices Already Connected:
- `desktop_001` - Your MacBook Air (currently online)
- `gps_001` - Vehicle Tracker 1 (online)
- `gps_002` - Vehicle Tracker 2 (offline)
- `test_device` - Test desktop device (online)

## 🔧 Network Error Fix Applied
✅ Fixed API endpoints to use proper base URL (`http://localhost:5001`)
✅ Send Message, Lock Screen, and Execute Command should work now

---

## 📱 1. Adding Desktop Computers

### Method A: Install Python Agent on Target Computer

```bash
# On the target computer you want to monitor:
git clone [your-repo-url] 
cd "Tracking QRCode/device-agents/desktop"

# Install dependencies
pip install -r requirements.txt

# Configure the device
cp agent_config.json.example agent_config.json

# Edit the config file:
nano agent_config.json
```

**agent_config.json example:**
```json
{
  "server_url": "http://YOUR_DASHBOARD_IP:5001",
  "device_id": "office_computer_001",
  "device_name": "Office Desktop PC",
  "device_type": "desktop",
  "update_interval": 30,
  "location_enabled": true,
  "admin_commands_enabled": true,
  "allowed_commands": ["screenshot", "lock_screen", "shutdown", "restart"]
}
```

```bash
# Run the agent
python device_agent.py
```

### Method B: Manual Device Registration via API

```bash
# Add a device manually to the dashboard
curl -X POST http://localhost:5001/api/device-monitor/devices/register \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "laptop_002",
    "name": "Sarah's Laptop",
    "type": "desktop",
    "deviceInfo": {
      "platform": "Windows",
      "hostname": "SARAH-LAPTOP"
    }
  }'
```

---

## 📱 2. Adding Mobile Devices

### Method A: React Native App

```bash
# On a phone/tablet:
cd "Tracking QRCode/device-agents/mobile"
npm install

# Configure the app
cp config.js.example config.js

# Edit config:
nano config.js
```

**config.js example:**
```javascript
export const config = {
  serverUrl: 'http://YOUR_DASHBOARD_IP:5001',
  deviceId: 'iphone_001',
  deviceName: 'John's iPhone',
  deviceType: 'mobile',
  updateInterval: 60,
  locationEnabled: true,
  backgroundSync: true
};
```

```bash
# Run on iOS/Android
npx expo start
# Then scan QR code with Expo Go app
```

### Method B: Manual Mobile Registration

```bash
curl -X POST http://localhost:5001/api/device-monitor/devices/register \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "android_001",
    "name": "Android Phone",
    "type": "mobile",
    "deviceInfo": {
      "platform": "Android",
      "model": "Samsung Galaxy S22"
    }
  }'
```

---

## 🚗 3. Adding GPS Hardware Trackers

### For Vehicles, Assets, or Standalone GPS Devices

```bash
# Register a GPS hardware tracker
curl -X POST http://localhost:5001/api/device-monitor/devices/register \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "vehicle_003",
    "name": "Company Van #3",
    "type": "gps_tracker",
    "deviceInfo": {
      "hardware": "SIM7600G-H",
      "imei": "123456789012345",
      "vehicle": {
        "make": "Ford",
        "model": "Transit",
        "plate": "ABC-123"
      }
    }
  }'
```

**Hardware Setup:**
1. Use Arduino/Raspberry Pi with GPS + GSM module
2. Configure to send HTTP POST requests to your backend
3. Use the `/api/device-monitor/location` endpoint

**Sample Arduino code** (simplified):
```cpp
// Send location update
void sendLocation(float lat, float lon) {
  String payload = "{";
  payload += "\"deviceId\":\"vehicle_003\",";
  payload += "\"latitude\":" + String(lat, 6) + ",";
  payload += "\"longitude\":" + String(lon, 6) + ",";
  payload += "\"accuracy\":5";
  payload += "}";
  
  http.POST(payload);
}
```

---

## 🔧 4. Adding Custom IoT Devices

### Raspberry Pi / Arduino with Internet Connection

```bash
# Register an IoT device
curl -X POST http://localhost:5001/api/device-monitor/devices/register \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "sensor_001",
    "name": "Warehouse Temperature Sensor",
    "type": "iot_device",
    "deviceInfo": {
      "hardware": "Raspberry Pi 4",
      "sensors": ["temperature", "humidity", "gps"],
      "location": "Warehouse Building A"
    }
  }'
```

---

## 🏃‍♂️ Quick Testing Guide

### 1. Test New Device Registration
```bash
# Add a test device
curl -X POST http://localhost:5001/api/device-monitor/devices/register \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "test_laptop",
    "name": "Test Laptop",
    "type": "desktop"
  }'

# Check if it appears in dashboard
curl http://localhost:5001/api/device-monitor/devices | jq
```

### 2. Test Sending Location Updates
```bash
# Simulate a location update from the new device
curl -X POST http://localhost:5001/api/device-monitor/location \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "test_laptop",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "accuracy": 10
  }'
```

### 3. Test Admin Commands
```bash
# Send a message to the device
curl -X POST http://localhost:5001/api/device-monitor/devices/test_laptop/message \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Welcome!",
    "message": "Your device is now being monitored."
  }'
```

---

## 🔒 Security & Production Setup

### For Production Deployment:

1. **Change server URL** in all agent configs:
   ```
   "server_url": "https://your-domain.com"
   ```

2. **Add authentication** to device registration:
   ```bash
   curl -X POST https://your-domain.com/api/device-monitor/devices/register \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"deviceId": "...", ...}'
   ```

3. **Use HTTPS** for all communications

4. **Set up device authentication keys** in agent configs

---

## 🎯 Next Steps

1. **Choose devices to add** from the list above
2. **Test with one device first** using the quick testing guide
3. **Deploy agents** on target devices
4. **Monitor in dashboard** at http://localhost:3001
5. **Send test messages** to verify admin functions work

**Need help with a specific device type?** Let me know which devices you want to add and I can provide more detailed setup instructions!
