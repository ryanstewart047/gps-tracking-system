# Device Agent Installation Guide

## 🚀 Quick Installation

Since you're seeing "No devices found", let's get some device agents connected to your dashboard!

## Option 1: Python Desktop Agent (Recommended for Testing)

### Step 1: Install Python Dependencies
```bash
cd "/Users/new/Tracking QRCode/device-agents/desktop"
pip3 install -r requirements.txt
```

### Step 2: Configure the Agent
Edit the `agent_config.json` file:
```json
{
  "device_id": "desktop_001", 
  "device_name": "MacBook Pro",
  "server_url": "http://localhost:5000",
  "update_interval": 30,
  "location_enabled": true
}
```

### Step 3: Run the Desktop Agent
```bash
python3 device_agent.py
```

## Option 2: React Native Mobile App

### Step 1: Install Dependencies
```bash
cd "/Users/new/Tracking QRCode/device-agents/mobile"
npm install
```

### Step 2: Start the Mobile App
```bash
npx expo start
```

### Step 3: Test on Device
- Scan the QR code with Expo Go app
- Or use iOS Simulator / Android Emulator

## Option 3: Hardware GPS Tracker

### Components Needed:
- Arduino board (Uno/Nano)
- NEO-6M or NEO-8M GPS module
- SIM800L or SIM7600 GSM module
- SD card module (for offline storage)
- Battery pack

### Quick Setup:
1. Upload the Arduino firmware from `/arduino/gps_tracker/`
2. Connect GPS and GSM modules according to wiring diagram
3. Insert SIM card with data plan
4. Power on and wait for GPS lock

## 🔧 Backend Database Setup

The backend needs a database to store device data. You have two options:

### Option A: Use MongoDB (Full Features)
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Restart backend
npm run server:dev
```

### Option B: Use Mock Data (Quick Testing)
I can modify the backend to use local file storage instead of MongoDB for testing.

## 🏃‍♂️ Quick Test Commands

Run these in order:

```bash
# Terminal 1: Start backend (with mock data)
cd "/Users/new/Tracking QRCode"
npm run server:dev

# Terminal 2: Start frontend (already running)
# http://localhost:3000

# Terminal 3: Start desktop agent
cd "/Users/new/Tracking QRCode/device-agents/desktop"
python3 device_agent.py

# Terminal 4: Start mobile app (optional)
cd "/Users/new/Tracking QRCode/device-agents/mobile"  
npx expo start
```

## 📱 Expected Results

After starting the agents, you should see:

1. **Desktop Agent**: Shows up as "Desktop Computer" in the dashboard
2. **Mobile Agent**: Shows up as "Mobile Device" in the dashboard  
3. **Real-time Location**: GPS coordinates updating every 30 seconds
4. **Admin Features**: Ability to send messages, lock screens, etc.

## 🚨 Troubleshooting

### "No devices found"
- Check if backend is running (port 5000)
- Verify device agents are connected
- Check WebSocket connection in browser console

### "Backend connection failed" 
- Install and start MongoDB
- Or I can modify backend for file-based storage

### "Location permission denied"
- Allow location access in browser/app settings
- For desktop: may need to enable location services

Would you like me to:
1. 🔧 Modify the backend to work without MongoDB (fastest option)
2. 🐍 Help install the Python desktop agent 
3. 📱 Set up the mobile app
4. 🗄️ Install MongoDB for full functionality

Choose your preferred path and I'll help you get devices connected!
