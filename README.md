# GPS Tracking System

A complete GPS tracking system with GSM connectivity that supports both online and offline tracking. Built with Node.js, React, Arduino, and real-time communication.

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
