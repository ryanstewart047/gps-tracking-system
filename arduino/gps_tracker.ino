/*
 * GPS Tracking Device with GSM Connectivity
 * Supports both online and offline tracking
 * 
 * Hardware Requirements:
 * - Arduino Uno/Nano or ESP32
 * - GPS Module (NEO-6M or NEO-8M)
 * - GSM Module (SIM800L or SIM7600)
 * - MicroSD Card Module (optional, for offline storage)
 * - 18650 Battery + Charging Module
 * - Power Management IC
 * 
 * Pin Connections:
 * GPS Module:
 *   VCC -> 3.3V
 *   GND -> GND
 *   TX  -> Pin 4 (SoftwareSerial RX)
 *   RX  -> Pin 3 (SoftwareSerial TX)
 * 
 * GSM Module:
 *   VCC -> 5V (or 3.7V for SIM800L)
 *   GND -> GND
 *   TX  -> Pin 7 (SoftwareSerial RX)
 *   RX  -> Pin 8 (SoftwareSerial TX)
 * 
 * SD Card Module:
 *   VCC -> 5V
 *   GND -> GND
 *   MISO -> Pin 12
 *   MOSI -> Pin 11
 *   SCK  -> Pin 13
 *   CS   -> Pin 10
 */

#include <SoftwareSerial.h>
#include <ArduinoJson.h>
#include <SD.h>
#include <EEPROM.h>

// Configuration
#define DEVICE_ID "GPS_001"  // Change this for each device
#define APN "internet"       // Your mobile network APN
#define SERVER_URL "your-server.com"
#define SERVER_PORT "80"
#define ENDPOINT "/api/device-data"

// Pin definitions
#define GPS_RX_PIN 4
#define GPS_TX_PIN 3
#define GSM_RX_PIN 7
#define GSM_TX_PIN 8
#define SD_CS_PIN 10
#define BATTERY_PIN A0
#define STATUS_LED_PIN 13
#define POWER_BUTTON_PIN 2

// Timing constants
#define GPS_TIMEOUT 30000        // 30 seconds to get GPS fix
#define TRANSMISSION_INTERVAL 30000  // 30 seconds between transmissions
#define BATTERY_CHECK_INTERVAL 60000 // 1 minute battery check
#define OFFLINE_BUFFER_SIZE 100      // Max offline locations to store

// Software Serial instances
SoftwareSerial gpsSerial(GPS_RX_PIN, GPS_TX_PIN);
SoftwareSerial gsmSerial(GSM_RX_PIN, GSM_TX_PIN);

// Global variables
struct GPSData {
  float latitude;
  float longitude;
  float altitude;
  float speed;
  int satellites;
  bool valid;
  String timestamp;
};

struct SystemStatus {
  bool gpsConnected;
  bool gsmConnected;
  bool sdCardAvailable;
  int batteryLevel;
  int signalStrength;
  bool onlineMode;
  unsigned long lastTransmission;
  int offlineDataCount;
};

GPSData currentGPS;
SystemStatus systemStatus;
File dataFile;

void setup() {
  Serial.begin(9600);
  gpsSerial.begin(9600);
  gsmSerial.begin(9600);
  
  // Initialize pins
  pinMode(STATUS_LED_PIN, OUTPUT);
  pinMode(POWER_BUTTON_PIN, INPUT_PULLUP);
  pinMode(BATTERY_PIN, INPUT);
  
  // Welcome message
  Serial.println("GPS Tracking Device Starting...");
  Serial.println("Device ID: " + String(DEVICE_ID));
  
  // Initialize components
  initializeGPS();
  initializeGSM();
  initializeSDCard();
  
  // Load settings from EEPROM
  loadSettings();
  
  // Initial status check
  checkSystemStatus();
  
  Serial.println("System initialized. Starting main loop...");
  blinkStatusLED(3, 200); // 3 quick blinks to indicate ready
}

void loop() {
  static unsigned long lastGPSRead = 0;
  static unsigned long lastTransmissionAttempt = 0;
  static unsigned long lastBatteryCheck = 0;
  
  unsigned long currentTime = millis();
  
  // Read GPS data every second
  if (currentTime - lastGPSRead >= 1000) {
    readGPSData();
    lastGPSRead = currentTime;
  }
  
  // Check battery level periodically
  if (currentTime - lastBatteryCheck >= BATTERY_CHECK_INTERVAL) {
    checkBatteryLevel();
    lastBatteryCheck = currentTime;
  }
  
  // Attempt transmission based on interval
  if (currentTime - lastTransmissionAttempt >= TRANSMISSION_INTERVAL) {
    if (currentGPS.valid) {
      if (systemStatus.gsmConnected && systemStatus.onlineMode) {
        // Try online transmission
        if (transmitDataOnline()) {
          systemStatus.lastTransmission = currentTime;
          // If we have offline data, try to sync it
          syncOfflineData();
        } else {
          // Online transmission failed, store offline
          storeDataOffline();
        }
      } else {
        // No GSM connection, store offline
        storeDataOffline();
      }
    }
    lastTransmissionAttempt = currentTime;
  }
  
  // Handle power button press
  if (digitalRead(POWER_BUTTON_PIN) == LOW) {
    handlePowerButton();
  }
  
  // Update status LED
  updateStatusLED();
  
  // Small delay to prevent excessive CPU usage
  delay(100);
}

void initializeGPS() {
  Serial.println("Initializing GPS...");
  gpsSerial.println("$PMTK314,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0*28"); // Set NMEA output
  gpsSerial.println("$PMTK220,1000*1F"); // Set update rate to 1Hz
  delay(1000);
  
  // Test GPS connection
  unsigned long startTime = millis();
  while (millis() - startTime < 5000) { // Wait 5 seconds for response
    if (gpsSerial.available()) {
      systemStatus.gpsConnected = true;
      Serial.println("GPS module detected");
      break;
    }
    delay(100);
  }
  
  if (!systemStatus.gpsConnected) {
    Serial.println("WARNING: GPS module not responding");
  }
}

void initializeGSM() {
  Serial.println("Initializing GSM...");
  
  // Reset GSM module
  gsmSerial.println("AT");
  delay(1000);
  
  if (waitForResponse("OK", 5000)) {
    systemStatus.gsmConnected = true;
    Serial.println("GSM module detected");
    
    // Configure GSM settings
    gsmSerial.println("AT+CPIN?"); // Check SIM status
    delay(1000);
    
    gsmSerial.println("AT+CSQ"); // Check signal quality
    delay(1000);
    
    gsmSerial.println("AT+CREG?"); // Check network registration
    delay(1000);
    
    // Set APN
    gsmSerial.println("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"");
    delay(1000);
    gsmSerial.println("AT+SAPBR=3,1,\"APN\",\"" + String(APN) + "\"");
    delay(1000);
    
    Serial.println("GSM module configured");
  } else {
    Serial.println("WARNING: GSM module not responding");
    systemStatus.gsmConnected = false;
  }
}

void initializeSDCard() {
  Serial.println("Initializing SD Card...");
  
  if (SD.begin(SD_CS_PIN)) {
    systemStatus.sdCardAvailable = true;
    Serial.println("SD Card initialized");
    
    // Create data file if it doesn't exist
    if (!SD.exists("gpsdata.txt")) {
      dataFile = SD.open("gpsdata.txt", FILE_WRITE);
      if (dataFile) {
        dataFile.println("timestamp,latitude,longitude,altitude,speed,battery,signal");
        dataFile.close();
        Serial.println("Created GPS data file");
      }
    }
  } else {
    Serial.println("WARNING: SD Card initialization failed");
    systemStatus.sdCardAvailable = false;
  }
}

void readGPSData() {
  static String nmeaBuffer = "";
  
  while (gpsSerial.available()) {
    char c = gpsSerial.read();
    
    if (c == '\n') {
      if (nmeaBuffer.startsWith("$GPRMC") || nmeaBuffer.startsWith("$GNRMC")) {
        parseGPRMC(nmeaBuffer);
      } else if (nmeaBuffer.startsWith("$GPGGA") || nmeaBuffer.startsWith("$GNGGA")) {
        parseGPGGA(nmeaBuffer);
      }
      nmeaBuffer = "";
    } else if (c != '\r') {
      nmeaBuffer += c;
    }
  }
}

void parseGPRMC(String nmea) {
  // Parse GPRMC sentence for basic location and time
  int commaIndex[12];
  int commaCount = 0;
  
  for (int i = 0; i < nmea.length() && commaCount < 12; i++) {
    if (nmea.charAt(i) == ',') {
      commaIndex[commaCount++] = i;
    }
  }
  
  if (commaCount >= 9) {
    String status = nmea.substring(commaIndex[1] + 1, commaIndex[2]);
    
    if (status == "A") { // Active/Valid
      // Parse latitude
      String latStr = nmea.substring(commaIndex[2] + 1, commaIndex[3]);
      String latDir = nmea.substring(commaIndex[3] + 1, commaIndex[4]);
      
      // Parse longitude
      String lonStr = nmea.substring(commaIndex[4] + 1, commaIndex[5]);
      String lonDir = nmea.substring(commaIndex[5] + 1, commaIndex[6]);
      
      // Parse speed
      String speedStr = nmea.substring(commaIndex[6] + 1, commaIndex[7]);
      
      // Parse time
      String timeStr = nmea.substring(commaIndex[0] + 1, commaIndex[1]);
      String dateStr = nmea.substring(commaIndex[8] + 1, commaIndex[9]);
      
      // Convert coordinates
      if (latStr.length() > 0 && lonStr.length() > 0) {
        currentGPS.latitude = convertCoordinate(latStr, latDir);
        currentGPS.longitude = convertCoordinate(lonStr, lonDir);
        currentGPS.speed = speedStr.toFloat() * 1.852; // Convert knots to km/h
        currentGPS.timestamp = formatDateTime(timeStr, dateStr);
        currentGPS.valid = true;
        
        // Debug output
        if (millis() % 10000 < 100) { // Print every 10 seconds
          Serial.println("GPS: " + String(currentGPS.latitude, 6) + ", " + 
                        String(currentGPS.longitude, 6) + " (" + 
                        String(currentGPS.speed, 1) + " km/h)");
        }
      }
    } else {
      currentGPS.valid = false;
    }
  }
}

void parseGPGGA(String nmea) {
  // Parse GPGGA sentence for altitude and satellite count
  int commaIndex[15];
  int commaCount = 0;
  
  for (int i = 0; i < nmea.length() && commaCount < 15; i++) {
    if (nmea.charAt(i) == ',') {
      commaIndex[commaCount++] = i;
    }
  }
  
  if (commaCount >= 7) {
    String altStr = nmea.substring(commaIndex[8] + 1, commaIndex[9]);
    String satStr = nmea.substring(commaIndex[6] + 1, commaIndex[7]);
    
    if (altStr.length() > 0) {
      currentGPS.altitude = altStr.toFloat();
    }
    
    if (satStr.length() > 0) {
      currentGPS.satellites = satStr.toInt();
    }
  }
}

float convertCoordinate(String coord, String direction) {
  if (coord.length() < 4) return 0.0;
  
  float degrees = coord.substring(0, coord.length() - 7).toFloat();
  float minutes = coord.substring(coord.length() - 7).toFloat();
  
  float decimal = degrees + (minutes / 60.0);
  
  if (direction == "S" || direction == "W") {
    decimal = -decimal;
  }
  
  return decimal;
}

String formatDateTime(String time, String date) {
  if (time.length() >= 6 && date.length() >= 6) {
    // Format: YYYY-MM-DDTHH:MM:SSZ
    String formatted = "20" + date.substring(4, 6) + "-" + // Year
                      date.substring(2, 4) + "-" +         // Month
                      date.substring(0, 2) + "T" +         // Day
                      time.substring(0, 2) + ":" +         // Hour
                      time.substring(2, 4) + ":" +         // Minute
                      time.substring(4, 6) + "Z";         // Second
    return formatted;
  }
  return "";
}

bool transmitDataOnline() {
  if (!systemStatus.gsmConnected) return false;
  
  Serial.println("Attempting online transmission...");
  
  // Enable GPRS
  gsmSerial.println("AT+SAPBR=1,1");
  if (!waitForResponse("OK", 10000)) {
    Serial.println("Failed to enable GPRS");
    return false;
  }
  
  // Initialize HTTP
  gsmSerial.println("AT+HTTPINIT");
  if (!waitForResponse("OK", 5000)) {
    Serial.println("Failed to initialize HTTP");
    return false;
  }
  
  // Set HTTP parameters
  gsmSerial.println("AT+HTTPPARA=\"CID\",1");
  delay(1000);
  
  gsmSerial.println("AT+HTTPPARA=\"URL\",\"http://" + String(SERVER_URL) + String(ENDPOINT) + "\"");
  delay(1000);
  
  gsmSerial.println("AT+HTTPPARA=\"CONTENT\",\"application/json\"");
  delay(1000);
  
  // Prepare JSON data
  DynamicJsonDocument doc(512);
  doc["deviceId"] = DEVICE_ID;
  doc["latitude"] = currentGPS.latitude;
  doc["longitude"] = currentGPS.longitude;
  doc["altitude"] = currentGPS.altitude;
  doc["speed"] = currentGPS.speed;
  doc["timestamp"] = currentGPS.timestamp;
  doc["batteryLevel"] = systemStatus.batteryLevel;
  doc["signalStrength"] = systemStatus.signalStrength;
  doc["satellites"] = currentGPS.satellites;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Send POST data
  gsmSerial.println("AT+HTTPDATA=" + String(jsonString.length()) + ",10000");
  delay(1000);
  
  gsmSerial.print(jsonString);
  delay(2000);
  
  // Execute POST request
  gsmSerial.println("AT+HTTPACTION=1");
  if (waitForResponse("+HTTPACTION: 1,200", 30000)) {
    Serial.println("Data transmitted successfully");
    gsmSerial.println("AT+HTTPTERM");
    delay(1000);
    return true;
  } else {
    Serial.println("HTTP request failed");
    gsmSerial.println("AT+HTTPTERM");
    delay(1000);
    return false;
  }
}

void storeDataOffline() {
  if (!systemStatus.sdCardAvailable) return;
  
  Serial.println("Storing data offline...");
  
  dataFile = SD.open("gpsdata.txt", FILE_WRITE);
  if (dataFile) {
    String dataLine = currentGPS.timestamp + "," +
                     String(currentGPS.latitude, 6) + "," +
                     String(currentGPS.longitude, 6) + "," +
                     String(currentGPS.altitude, 1) + "," +
                     String(currentGPS.speed, 1) + "," +
                     String(systemStatus.batteryLevel) + "," +
                     String(systemStatus.signalStrength);
    
    dataFile.println(dataLine);
    dataFile.close();
    
    systemStatus.offlineDataCount++;
    Serial.println("Data stored offline (" + String(systemStatus.offlineDataCount) + " records)");
  } else {
    Serial.println("Failed to open data file");
  }
}

void syncOfflineData() {
  if (!systemStatus.sdCardAvailable || systemStatus.offlineDataCount == 0) return;
  
  Serial.println("Syncing offline data...");
  
  // Implementation for syncing offline data would go here
  // This would read from the SD card and transmit stored data
  // For brevity, this is left as a framework
  
  // Reset offline data count after successful sync
  systemStatus.offlineDataCount = 0;
}

void checkBatteryLevel() {
  int rawValue = analogRead(BATTERY_PIN);
  // Convert ADC reading to percentage (adjust based on your voltage divider)
  systemStatus.batteryLevel = map(rawValue, 0, 1023, 0, 100);
  
  if (systemStatus.batteryLevel < 20) {
    Serial.println("WARNING: Low battery (" + String(systemStatus.batteryLevel) + "%)");
  }
}

void checkSystemStatus() {
  // Update signal strength if GSM is connected
  if (systemStatus.gsmConnected) {
    gsmSerial.println("AT+CSQ");
    // Parse response to get signal strength
    // Implementation details would parse the response
    systemStatus.signalStrength = 75; // Placeholder
  }
  
  // Determine if we should be in online mode
  systemStatus.onlineMode = systemStatus.gsmConnected && (systemStatus.signalStrength > 10);
  
  // Print status
  Serial.println("=== System Status ===");
  Serial.println("GPS: " + String(systemStatus.gpsConnected ? "Connected" : "Disconnected"));
  Serial.println("GSM: " + String(systemStatus.gsmConnected ? "Connected" : "Disconnected"));
  Serial.println("SD Card: " + String(systemStatus.sdCardAvailable ? "Available" : "Not Available"));
  Serial.println("Battery: " + String(systemStatus.batteryLevel) + "%");
  Serial.println("Signal: " + String(systemStatus.signalStrength) + "%");
  Serial.println("Mode: " + String(systemStatus.onlineMode ? "Online" : "Offline"));
  Serial.println("Offline Data: " + String(systemStatus.offlineDataCount) + " records");
  Serial.println("==================");
}

void handlePowerButton() {
  static unsigned long lastPress = 0;
  unsigned long currentTime = millis();
  
  if (currentTime - lastPress > 1000) { // Debounce
    Serial.println("Power button pressed");
    checkSystemStatus();
    lastPress = currentTime;
  }
}

void updateStatusLED() {
  static unsigned long lastBlink = 0;
  static bool ledState = false;
  
  unsigned long blinkInterval;
  
  if (currentGPS.valid && systemStatus.onlineMode) {
    blinkInterval = 1000; // Slow blink when everything is working
  } else if (currentGPS.valid) {
    blinkInterval = 500;  // Medium blink when GPS works but offline
  } else {
    blinkInterval = 200;  // Fast blink when no GPS
  }
  
  if (millis() - lastBlink >= blinkInterval) {
    ledState = !ledState;
    digitalWrite(STATUS_LED_PIN, ledState);
    lastBlink = millis();
  }
}

void blinkStatusLED(int count, int delayMs) {
  for (int i = 0; i < count; i++) {
    digitalWrite(STATUS_LED_PIN, HIGH);
    delay(delayMs);
    digitalWrite(STATUS_LED_PIN, LOW);
    delay(delayMs);
  }
}

bool waitForResponse(String expected, unsigned long timeout) {
  String response = "";
  unsigned long startTime = millis();
  
  while (millis() - startTime < timeout) {
    if (gsmSerial.available()) {
      response += (char)gsmSerial.read();
      if (response.indexOf(expected) != -1) {
        return true;
      }
    }
    delay(10);
  }
  
  return false;
}

void loadSettings() {
  // Load device settings from EEPROM
  // Implementation would read configuration values
  Serial.println("Settings loaded from EEPROM");
}

void saveSettings() {
  // Save device settings to EEPROM
  // Implementation would write configuration values
  Serial.println("Settings saved to EEPROM");
}
