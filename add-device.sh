#!/bin/bash

# Quick Device Addition Script
# Usage: ./add-device.sh

echo "🚀 Device Addition Helper Script"
echo "================================="

# Check if backend is running
if ! curl -s http://localhost:5001/api/device-monitor/devices > /dev/null; then
    echo "❌ Backend server is not running on port 5001"
    echo "Please start the backend first: npm run server:dev"
    exit 1
fi

echo "✅ Backend server is running"
echo ""

echo "Select device type to add:"
echo "1) Desktop Computer"
echo "2) Mobile Device" 
echo "3) GPS Vehicle Tracker"
echo "4) IoT Sensor Device"
echo "5) Custom Device"
read -p "Enter choice (1-5): " choice

case $choice in
    1)
        echo "Adding Desktop Computer..."
        read -p "Device ID (e.g., laptop_001): " device_id
        read -p "Device Name (e.g., John's Laptop): " device_name
        read -p "Platform (Windows/macOS/Linux): " platform
        
        curl -X POST http://localhost:5001/api/device-monitor/devices/register \
          -H "Content-Type: application/json" \
          -d "{
            \"deviceId\": \"$device_id\",
            \"name\": \"$device_name\",
            \"type\": \"desktop\",
            \"deviceInfo\": {
              \"platform\": \"$platform\"
            }
          }"
        ;;
    2)
        echo "Adding Mobile Device..."
        read -p "Device ID (e.g., iphone_001): " device_id
        read -p "Device Name (e.g., Sarah's iPhone): " device_name
        read -p "Platform (iOS/Android): " platform
        
        curl -X POST http://localhost:5001/api/device-monitor/devices/register \
          -H "Content-Type: application/json" \
          -d "{
            \"deviceId\": \"$device_id\",
            \"name\": \"$device_name\",
            \"type\": \"mobile\",
            \"deviceInfo\": {
              \"platform\": \"$platform\"
            }
          }"
        ;;
    3)
        echo "Adding GPS Vehicle Tracker..."
        read -p "Device ID (e.g., vehicle_001): " device_id
        read -p "Vehicle Name (e.g., Company Car #1): " device_name
        read -p "Vehicle Make (e.g., Toyota): " make
        read -p "Vehicle Model (e.g., Camry): " model
        
        curl -X POST http://localhost:5001/api/device-monitor/devices/register \
          -H "Content-Type: application/json" \
          -d "{
            \"deviceId\": \"$device_id\",
            \"name\": \"$device_name\",
            \"type\": \"gps_tracker\",
            \"deviceInfo\": {
              \"vehicle\": {
                \"make\": \"$make\",
                \"model\": \"$model\"
              }
            }
          }"
        ;;
    4)
        echo "Adding IoT Sensor Device..."
        read -p "Device ID (e.g., sensor_001): " device_id
        read -p "Device Name (e.g., Temperature Sensor): " device_name
        read -p "Location (e.g., Warehouse A): " location
        
        curl -X POST http://localhost:5001/api/device-monitor/devices/register \
          -H "Content-Type: application/json" \
          -d "{
            \"deviceId\": \"$device_id\",
            \"name\": \"$device_name\",
            \"type\": \"iot_device\",
            \"deviceInfo\": {
              \"location\": \"$location\"
            }
          }"
        ;;
    5)
        echo "Adding Custom Device..."
        read -p "Device ID: " device_id
        read -p "Device Name: " device_name
        read -p "Device Type (custom/other): " device_type
        
        curl -X POST http://localhost:5001/api/device-monitor/devices/register \
          -H "Content-Type: application/json" \
          -d "{
            \"deviceId\": \"$device_id\",
            \"name\": \"$device_name\",
            \"type\": \"$device_type\"
          }"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Device registration request sent!"
echo ""
echo "🔍 Current devices:"
curl -s http://localhost:5001/api/device-monitor/devices | jq -r '.[] | "- \(.name) (\(.deviceId)) - \(.type)"'

echo ""
echo "🎯 Next steps:"
echo "1. Check the dashboard at http://localhost:3001"
echo "2. Install the device agent on the target device"
echo "3. Send a test location update:"
echo ""
echo "curl -X POST http://localhost:5001/api/device-monitor/location \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"deviceId\": \"$device_id\", \"latitude\": 37.7749, \"longitude\": -122.4194}'"
