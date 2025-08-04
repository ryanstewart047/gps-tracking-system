# GPS Tracking System

# 🛰️ GPS Tracking System

A complete, production-ready GPS tracking system with real-time device monitoring, admin controls, and cross-platform support.

![System Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Platform](https://img.shields.io/badge/Platform-Cross%20Platform-orange)

## 🚀 Features

- **Real-time Device Tracking** - Live location updates every 30 seconds
- **Device Management** - Send messages, lock screens, execute commands
- **Cross-Platform Support** - Desktop (Windows/macOS/Linux), Mobile (iOS/Android), GPS Hardware
- **Online/Offline Capability** - Works with GSM networks for offline tracking  
- **Admin Dashboard** - Modern React-based web interface
- **Production Ready** - Scalable backend with MongoDB, secure authentication
- **Easy Deployment** - One-click deployment to Railway + Vercel

## 📸 Screenshots

### Dashboard Overview
Your devices are displayed with real-time status, location, and battery information.

### Device Management
Click any device to send messages, lock screens, or execute remote commands.

## 🏗️ Architecture

```
├── server/              # Backend API (Node.js + TypeScript)
├── client/              # Web Dashboard (React + TypeScript)  
├── device-agents/       # Device monitoring agents
│   ├── desktop/         # Python agent for computers
│   └── mobile/          # React Native app
├── docs/                # Documentation and guides
└── arduino/             # Hardware tracker firmware
```

## ⚡ Quick Start (Development)

### Prerequisites
- Node.js 16+
- Python 3.8+
- MongoDB (or use MongoDB Atlas)

### 1. Clone and Install
```bash
git clone https://github.com/ryanstewart047/trackingsystem.git
cd trackingsystem
npm install
cd client && npm install
```

### 2. Start Development Servers
```bash
# Terminal 1: Backend + Frontend
npm run dev

# Terminal 2: Desktop Agent
cd device-agents/desktop
pip install -r requirements.txt
python device_agent.py
```

### 3. Open Dashboard
- Dashboard: http://localhost:3000
- Backend API: http://localhost:5001

## 🌐 Production Deployment

### Quick Deploy (10 minutes)

1. **Database Setup** - Create free MongoDB Atlas cluster
2. **Backend Deploy** - Deploy to Railway.app
3. **Frontend Deploy** - Deploy to Vercel.com
4. **Configure Agents** - Update device agent URLs

**Detailed Instructions:** See [DEPLOYMENT_INSTRUCTIONS.md](DEPLOYMENT_INSTRUCTIONS.md)

### Production URLs
- **Frontend**: `https://your-project.vercel.app`
- **Backend**: `https://your-project.railway.app`
- **API Health**: `https://your-project.railway.app/api/health`

## 📱 Supported Devices

### Desktop Computers
- **Windows** - Python agent with system integration
- **macOS** - Native notifications and screen lock
- **Linux** - Full admin command support

### Mobile Devices  
- **iOS** - React Native app with location services
- **Android** - Background tracking and notifications

### GPS Hardware
- **Vehicle Trackers** - SIM800L/SIM7600 modules
- **Asset Trackers** - Arduino + GPS + GSM
- **Custom IoT** - Raspberry Pi based solutions

## 🔧 Configuration

### Environment Variables

**Backend** (`.env.production`):
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
CORS_ORIGIN=https://your-frontend.vercel.app
```

**Frontend** (Vercel environment):
```bash
REACT_APP_API_URL=https://your-backend.railway.app
```

### Device Agent Config
```json
{
  "server_url": "https://your-backend.railway.app",
  "device_id": "unique-device-id",
  "device_name": "Device Display Name",
  "device_type": "desktop|mobile|gps_tracker",
  "update_interval": 30
}
```

## 🔒 Security Features

- ✅ JWT Authentication
- ✅ HTTPS Encryption
- ✅ CORS Protection
- ✅ Rate Limiting
- ✅ Input Validation
- ✅ Secure Device Authentication

## 💰 Cost Breakdown

| Service | Development | Production |
|---------|-------------|------------|
| MongoDB Atlas | Free (512MB) | Free (512MB) |
| Railway Backend | Free ($5 credit) | ~$5/month |
| Vercel Frontend | Free | Free |
| **Total** | **$0/month** | **~$5/month** |

## 📊 API Endpoints

### Device Management
- `GET /api/device-monitor/devices` - List all devices
- `POST /api/device-monitor/devices/register` - Register device
- `POST /api/device-monitor/location` - Update location

### Admin Commands  
- `POST /api/device-monitor/devices/:id/message` - Send message
- `POST /api/device-monitor/devices/:id/lock` - Lock screen
- `POST /api/device-monitor/devices/:id/command` - Execute command

### System
- `GET /api/health` - Health check
- `GET /api/status` - System status

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [DEPLOYMENT_INSTRUCTIONS.md](DEPLOYMENT_INSTRUCTIONS.md)
- **Device Setup**: [DEVICE_SETUP_GUIDE.md](DEVICE_SETUP_GUIDE.md)
- **Issues**: Create GitHub issue
- **Discussions**: GitHub Discussions tab

## 🎯 Roadmap

- [ ] Real-time WebSocket notifications
- [ ] Mobile push notifications  
- [ ] Geofencing alerts
- [ ] Historical location analytics
- [ ] Multi-tenant support
- [ ] Advanced reporting dashboard

---

**Built with ❤️ for device monitoring and tracking**

[![Deploy to Railway](https://railway.app/button.svg)](https://railway.app/new/template)
[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone) Built with Node.js, React, Arduino, and real-time communication.

## 🌟 Features

### Device Tracking
- **Real-time GPS tracking** with GSM/GPRS connectivity
- **Offline data storage** on SD card when no network available
- **Automatic data synchronization** when connection is restored
- **Battery monitoring** with low battery alerts
- **Signal strength monitoring**
- **Configurable reporting intervals**

### Web Dashboard
- **Real-time location updates** via WebSockets
- **Interactive maps** with device positioning
- **Location history** and route visualization
- **Geofencing** with entry/exit alerts
- **Device management** and configuration
- **Battery and signal monitoring**
- **Emergency alerts** and notifications

### Mobile App
- **Cross-platform** React Native application
- **Push notifications** for alerts
- **Offline map caching**
- **Device control** and monitoring

### Backend API
- **RESTful API** for all operations
- **WebSocket support** for real-time updates
- **MQTT integration** for IoT communication
- **MongoDB** for data storage
- **JWT authentication**
- **Rate limiting** and security

## 🏗️ Architecture

### System Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GPS Device    │────│   GSM Network   │────│   Backend API   │
│   (Arduino)     │    │                 │    │   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                         │
                                               ┌─────────┴─────────┐
                                               │                   │
                                    ┌─────────────────┐  ┌─────────────────┐
                                    │  Web Dashboard  │  │   Mobile App    │
                                    │    (React)      │  │ (React Native)  │
                                    └─────────────────┘  └─────────────────┘
```

### Data Flow
1. **GPS Device** → Collects location data
2. **GSM Module** → Transmits data via cellular network
3. **Backend API** → Processes and stores data
4. **WebSocket** → Real-time updates to clients
5. **Web/Mobile** → Display tracking information

## 🛠️ Hardware Requirements

### Core Components
| Component | Model | Purpose |
|-----------|-------|---------|
| Microcontroller | Arduino Uno/Nano or ESP32 | Main processing unit |
| GPS Module | NEO-6M or NEO-8M | Location tracking |
| GSM Module | SIM800L or SIM7600 | Cellular connectivity |
| SD Card Module | Standard SD reader | Offline data storage |
| Battery | 18650 Li-ion + charging circuit | Power supply |
| Enclosure | Waterproof case | Protection |

### Pin Connections
```
GPS Module (NEO-6M):
VCC → 3.3V
GND → GND
TX  → Pin 4 (Arduino RX)
RX  → Pin 3 (Arduino TX)

GSM Module (SIM800L):
VCC → 5V (or 3.7V for SIM800L)
GND → GND
TX  → Pin 7 (Arduino RX)
RX  → Pin 8 (Arduino TX)

SD Card Module:
VCC → 5V
GND → GND
MISO → Pin 12
MOSI → Pin 11
SCK  → Pin 13
CS   → Pin 10
```

## 📱 Software Setup

### Prerequisites
- Node.js 16+ and npm
- MongoDB 4.4+
- Arduino IDE (for device firmware)
- Git

### Backend Setup
```bash
# Clone the repository
git clone <repository-url>
cd gps-tracking-system

# Install backend dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Start MongoDB (if running locally)
mongod

# Start the backend server
npm run server:dev
```

### Environment Variables
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/gps-tracking

# JWT Authentication
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRE=7d

# Client URLs
CLIENT_URL=http://localhost:3000
MOBILE_URL=http://localhost:19006

# MQTT (Optional)
MQTT_ENABLED=false
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=

# GSM Configuration (for reference)
APN=internet
SERVER_URL=your-server.com
```

### Web Dashboard Setup
```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start development server
npm start
```

### Mobile App Setup
```bash
# Install React Native CLI
npm install -g @react-native-community/cli

# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# For iOS
cd ios && pod install && cd ..
npx react-native run-ios

# For Android
npx react-native run-android
```

### Arduino Firmware Setup
1. Open `arduino/gps_tracker.ino` in Arduino IDE
2. Install required libraries:
   - SoftwareSerial (built-in)
   - ArduinoJson
   - SD (built-in)
3. Configure device settings in the code:
   ```cpp
   #define DEVICE_ID "GPS_001"  // Unique device identifier
   #define APN "internet"       // Your carrier's APN
   #define SERVER_URL "your-server.com"
   ```
4. Upload to Arduino

## 🚀 Deployment

### Backend Deployment (using PM2)
```bash
# Build the project
npm run build

# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start dist/server/index.js --name "gps-tracker-api"

# Setup auto-restart on reboot
pm2 startup
pm2 save
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Cloud Deployment
The system can be deployed on:
- **AWS**: EC2 + RDS + S3
- **Google Cloud**: Compute Engine + Cloud SQL
- **Azure**: App Service + CosmosDB
- **DigitalOcean**: Droplets + Managed Database

## 📊 API Documentation

### Authentication
```javascript
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
```

### Device Management
```javascript
GET    /api/devices          // List all devices
POST   /api/devices          // Add new device
GET    /api/devices/:id      // Get device details
PUT    /api/devices/:id      // Update device
DELETE /api/devices/:id      // Remove device
```

### Location Tracking
```javascript
GET  /api/locations/:deviceId           // Get location history
GET  /api/locations/:deviceId/current   // Get current location
GET  /api/locations/:deviceId/route     // Get route for date range
POST /api/device-data                   // Device data endpoint (for GPS devices)
```

### Real-time WebSocket Events
```javascript
// Client to Server
authenticate
subscribe_device
unsubscribe_device
request_current_location

// Server to Client
location_update
device_status
battery_alert
geofence_alert
emergency_alert
```

## 🔧 Configuration

### Device Settings
- **Reporting Interval**: 30-3600 seconds
- **Battery Threshold**: 5-50%
- **Geofencing**: Enable/disable
- **Offline Storage**: Enable/disable

### Server Settings
- **Data Retention**: Default 30 days
- **Rate Limiting**: 100 requests/minute
- **WebSocket Timeout**: 30 seconds
- **MQTT Keep-alive**: 60 seconds

## 🛡️ Security Features

- **JWT Authentication** with refresh tokens
- **API Rate Limiting** to prevent abuse
- **Data Encryption** in transit (HTTPS/WSS)
- **Device Authentication** via unique IDs
- **Input Validation** and sanitization
- **CORS Protection** for web clients

## 🧪 Testing

### Backend Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- --grep "LocationService"
```

### Frontend Tests
```bash
cd client
npm test
```

## 📈 Monitoring & Analytics

### Available Metrics
- Device online/offline status
- Battery levels and trends
- Signal strength monitoring
- Location accuracy statistics
- Data transmission success rates
- System performance metrics

### Logging
- Structured logging with timestamps
- Error tracking and alerting
- Performance monitoring
- Device communication logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

**GPS not getting fix:**
- Ensure GPS antenna has clear sky view
- Check GPS module connections
- Verify GPS module power supply (3.3V)

**GSM connection failed:**
- Verify SIM card is activated and has data plan
- Check APN settings for your carrier
- Ensure good cellular signal strength

**Device not reporting:**
- Check power supply and battery level
- Verify server URL and endpoint
- Check device logs via serial monitor

**WebSocket connection issues:**
- Verify CORS settings
- Check firewall and port configuration
- Ensure proper authentication

### Getting Help
- Create an issue on GitHub
- Check the [Wiki](wiki) for detailed guides
- Review the [FAQ](docs/FAQ.md)

## 🗺️ Roadmap

### Version 2.0
- [ ] Multi-tenant support
- [ ] Advanced geofencing shapes
- [ ] Machine learning for route optimization
- [ ] Integration with fleet management systems
- [ ] Advanced analytics dashboard

### Version 2.1
- [ ] Voice alerts and commands
- [ ] Integration with emergency services
- [ ] Weather data integration
- [ ] Predictive maintenance alerts
- [ ] Advanced reporting and exports

---

**Made with ❤️ for the IoT and tracking community**
