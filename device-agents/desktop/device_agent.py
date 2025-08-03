#!/usr/bin/env python3
"""
GPS Tracking System - Desktop Device Agent
Monitors computer location and responds to remote admin commands
"""

import json
import time
import threading
import platform
import psutil
import requests
import websocket
import subprocess
import os
import sys
from datetime import datetime
from typing import Optional, Dict, Any
import tkinter as tk
from tkinter import messagebox
import geocoder

class DeviceAgent:
    def __init__(self, server_url: str, device_id: str, auth_token: str):
        self.server_url = server_url.rstrip('/')
        self.device_id = device_id
        self.auth_token = auth_token
        self.ws: Optional[websocket.WebSocketApp] = None
        self.running = False
        self.location_thread = None
        self.heartbeat_thread = None
        
        # Device info
        self.device_info = self._get_device_info()
        
        # GUI for messages
        self.root = None
        self._setup_gui()
        
    def _get_device_info(self) -> Dict[str, Any]:
        """Get comprehensive device information"""
        return {
            'deviceId': self.device_id,
            'type': 'desktop',
            'platform': platform.system(),
            'platformVersion': platform.release(),
            'hostname': platform.node(),
            'processor': platform.processor(),
            'architecture': platform.architecture()[0],
            'username': os.getlogin(),
            'pythonVersion': platform.python_version(),
            'startTime': datetime.now().isoformat()
        }
    
    def _setup_gui(self):
        """Setup minimal GUI for message display"""
        self.root = tk.Tk()
        self.root.withdraw()  # Hide main window
        
    def _get_location(self) -> Optional[Dict[str, Any]]:
        """Get current device location using various methods"""
        try:
            # Try IP-based geolocation first (works everywhere)
            g = geocoder.ip('me')
            if g.ok:
                location = {
                    'latitude': g.latlng[0],
                    'longitude': g.latlng[1],
                    'accuracy': 1000,  # IP-based is less accurate
                    'method': 'ip',
                    'address': g.address,
                    'city': g.city,
                    'country': g.country
                }
                
                # Try to get more accurate location if possible
                try:
                    # On macOS, try using CoreLocation
                    if platform.system() == 'Darwin':
                        accurate_location = self._get_macos_location()
                        if accurate_location:
                            location.update(accurate_location)
                            location['method'] = 'gps'
                            location['accuracy'] = 10
                    
                    # On Windows, try using Windows Location API
                    elif platform.system() == 'Windows':
                        accurate_location = self._get_windows_location()
                        if accurate_location:
                            location.update(accurate_location)
                            location['method'] = 'gps'
                            location['accuracy'] = 10
                            
                except Exception as e:
                    print(f"Accurate location failed: {e}")
                
                return location
                
        except Exception as e:
            print(f"Location error: {e}")
            return None
    
    def _get_macos_location(self) -> Optional[Dict[str, float]]:
        """Get accurate location on macOS using CoreLocation"""
        try:
            # Simple AppleScript to get location
            script = '''
            tell application "System Events"
                return (do shell script "python3 -c \\"
import CoreLocation
import time

class LocationDelegate:
    def __init__(self):
        self.location = None
        
    def locationManager_didUpdateLocations_(self, manager, locations):
        self.location = locations[-1]
        
manager = CoreLocation.CLLocationManager.alloc().init()
delegate = LocationDelegate()
manager.setDelegate_(delegate)
manager.requestWhenInUseAuthorization()
manager.startUpdatingLocation()

time.sleep(2)  # Wait for location
if delegate.location:
    coord = delegate.location.coordinate()
    print(f'{coord.latitude},{coord.longitude}')
\\"")
            end tell
            '''
            result = subprocess.run(['osascript', '-e', script], 
                                  capture_output=True, text=True, timeout=10)
            if result.returncode == 0 and ',' in result.stdout:
                lat, lng = result.stdout.strip().split(',')
                return {'latitude': float(lat), 'longitude': float(lng)}
        except Exception as e:
            print(f"macOS location error: {e}")
        return None
    
    def _get_windows_location(self) -> Optional[Dict[str, float]]:
        """Get accurate location on Windows using Windows Location API"""
        try:
            # PowerShell script to get location
            script = '''
            Add-Type -AssemblyName System.Device
            $watcher = New-Object System.Device.Location.GeoCoordinateWatcher
            $watcher.Start()
            Start-Sleep -Seconds 3
            $coord = $watcher.Position.Location
            if ($coord.IsUnknown -eq $false) {
                Write-Output "$($coord.Latitude),$($coord.Longitude)"
            }
            $watcher.Stop()
            '''
            result = subprocess.run(['powershell', '-Command', script], 
                                  capture_output=True, text=True, timeout=10)
            if result.returncode == 0 and ',' in result.stdout:
                lat, lng = result.stdout.strip().split(',')
                return {'latitude': float(lat), 'longitude': float(lng)}
        except Exception as e:
            print(f"Windows location error: {e}")
        return None
    
    def _get_system_status(self) -> Dict[str, Any]:
        """Get current system status"""
        try:
            battery = None
            if hasattr(psutil, 'sensors_battery'):
                battery_info = psutil.sensors_battery()
                if battery_info:
                    battery = {
                        'percent': battery_info.percent,
                        'charging': battery_info.power_plugged,
                        'timeLeft': battery_info.secsleft if battery_info.secsleft != psutil.POWER_TIME_UNLIMITED else None
                    }
            
            return {
                'cpu': psutil.cpu_percent(interval=1),
                'memory': psutil.virtual_memory().percent,
                'disk': psutil.disk_usage('/').percent,
                'battery': battery,
                'networkConnections': len(psutil.net_connections()),
                'processes': len(psutil.pids()),
                'uptime': time.time() - psutil.boot_time(),
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"System status error: {e}")
            return {'error': str(e)}
    
    def send_location_update(self):
        """Send location and status update to server"""
        try:
            location = self._get_location()
            system_status = self._get_system_status()
            
            data = {
                'deviceId': self.device_id,
                'type': 'desktop',
                'location': location,
                'status': system_status,
                'deviceInfo': self.device_info,
                'timestamp': datetime.now().isoformat()
            }
            
            # Send to REST API
            response = requests.post(
                f"{self.server_url}/api/devices/location",
                json=data,
                headers={'Authorization': f'Bearer {self.auth_token}'},
                timeout=10
            )
            
            if response.status_code == 200:
                print(f"Location update sent: {location['city'] if location else 'Unknown'}")
                return True
            else:
                print(f"Failed to send location: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"Location update error: {e}")
            return False
    
    def on_websocket_message(self, ws, message):
        """Handle incoming WebSocket messages (admin commands)"""
        try:
            data = json.loads(message)
            command = data.get('command')
            payload = data.get('payload', {})
            
            print(f"Received command: {command}")
            
            if command == 'show_message':
                self.show_message(payload.get('title', 'Admin Message'), 
                                payload.get('message', 'No message content'))
            
            elif command == 'lock_screen':
                self.lock_screen()
            
            elif command == 'get_status':
                self.send_status_response(data.get('requestId'))
            
            elif command == 'execute_command':
                if payload.get('authorized', False):
                    result = self.execute_command(payload.get('command', ''))
                    self.send_command_response(data.get('requestId'), result)
            
            elif command == 'ping':
                self.send_pong(data.get('requestId'))
                
        except Exception as e:
            print(f"Message handling error: {e}")
    
    def show_message(self, title: str, message: str):
        """Show message dialog to user"""
        def show_dialog():
            messagebox.showinfo(title, message)
        
        # Run in main thread
        self.root.after(0, show_dialog)
        
        # Send confirmation back to server
        self.send_confirmation('message_shown', {'title': title})
    
    def lock_screen(self):
        """Lock the device screen"""
        try:
            system = platform.system()
            
            if system == 'Windows':
                subprocess.run(['rundll32.exe', 'user32.dll,LockWorkStation'])
            elif system == 'Darwin':  # macOS
                subprocess.run(['/System/Library/CoreServices/Menu Extras/User.menu/Contents/Resources/CGSession', '-suspend'])
            elif system == 'Linux':
                # Try common Linux screen lockers
                for cmd in [['gnome-screensaver-command', '--lock'], 
                           ['xdg-screensaver', 'lock'],
                           ['loginctl', 'lock-session']]:
                    try:
                        subprocess.run(cmd, check=True)
                        break
                    except (subprocess.CalledProcessError, FileNotFoundError):
                        continue
            
            self.send_confirmation('screen_locked', {'success': True})
            print("Screen locked successfully")
            
        except Exception as e:
            print(f"Screen lock error: {e}")
            self.send_confirmation('screen_locked', {'success': False, 'error': str(e)})
    
    def execute_command(self, command: str) -> Dict[str, Any]:
        """Execute authorized system command"""
        try:
            result = subprocess.run(command, shell=True, capture_output=True, 
                                  text=True, timeout=30)
            return {
                'success': True,
                'returnCode': result.returncode,
                'stdout': result.stdout,
                'stderr': result.stderr
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def send_confirmation(self, action: str, data: Dict[str, Any]):
        """Send action confirmation to server"""
        if self.ws:
            message = {
                'type': 'confirmation',
                'deviceId': self.device_id,
                'action': action,
                'data': data,
                'timestamp': datetime.now().isoformat()
            }
            self.ws.send(json.dumps(message))
    
    def send_status_response(self, request_id: str):
        """Send detailed status response"""
        status = self._get_system_status()
        location = self._get_location()
        
        response = {
            'type': 'status_response',
            'requestId': request_id,
            'deviceId': self.device_id,
            'status': status,
            'location': location,
            'deviceInfo': self.device_info
        }
        
        if self.ws:
            self.ws.send(json.dumps(response))
    
    def send_pong(self, request_id: str):
        """Send pong response"""
        response = {
            'type': 'pong',
            'requestId': request_id,
            'deviceId': self.device_id,
            'timestamp': datetime.now().isoformat()
        }
        
        if self.ws:
            self.ws.send(json.dumps(response))
    
    def on_websocket_error(self, ws, error):
        """Handle WebSocket errors"""
        print(f"WebSocket error: {error}")
    
    def on_websocket_close(self, ws, close_status_code, close_msg):
        """Handle WebSocket close"""
        print("WebSocket connection closed")
        if self.running:
            print("Attempting to reconnect in 10 seconds...")
            time.sleep(10)
            self.connect_websocket()
    
    def on_websocket_open(self, ws):
        """Handle WebSocket connection open"""
        print("WebSocket connected")
        
        # Send device registration
        registration = {
            'type': 'device_registration',
            'deviceId': self.device_id,
            'deviceInfo': self.device_info,
            'authToken': self.auth_token
        }
        ws.send(json.dumps(registration))
    
    def connect_websocket(self):
        """Connect to WebSocket server for real-time commands"""
        try:
            ws_url = self.server_url.replace('http://', 'ws://').replace('https://', 'wss://')
            ws_url = f"{ws_url}/ws/device/{self.device_id}"
            
            self.ws = websocket.WebSocketApp(
                ws_url,
                on_message=self.on_websocket_message,
                on_error=self.on_websocket_error,
                on_close=self.on_websocket_close,
                on_open=self.on_websocket_open,
                header={'Authorization': f'Bearer {self.auth_token}'}
            )
            
            # Run WebSocket in separate thread
            def run_ws():
                self.ws.run_forever()
            
            ws_thread = threading.Thread(target=run_ws, daemon=True)
            ws_thread.start()
            
        except Exception as e:
            print(f"WebSocket connection error: {e}")
    
    def location_update_loop(self):
        """Background thread for sending location updates"""
        while self.running:
            try:
                self.send_location_update()
                time.sleep(30)  # Update every 30 seconds
            except Exception as e:
                print(f"Location loop error: {e}")
                time.sleep(60)  # Retry after 1 minute
    
    def heartbeat_loop(self):
        """Send periodic heartbeat to maintain connection"""
        while self.running:
            try:
                if self.ws:
                    heartbeat = {
                        'type': 'heartbeat',
                        'deviceId': self.device_id,
                        'timestamp': datetime.now().isoformat()
                    }
                    self.ws.send(json.dumps(heartbeat))
                time.sleep(60)  # Heartbeat every minute
            except Exception as e:
                print(f"Heartbeat error: {e}")
                time.sleep(60)
    
    def start(self):
        """Start the device agent"""
        print(f"Starting device agent for {self.device_id}")
        print(f"Platform: {self.device_info['platform']} {self.device_info['platformVersion']}")
        print(f"Server: {self.server_url}")
        
        self.running = True
        
        # Connect to WebSocket
        self.connect_websocket()
        
        # Start background threads
        self.location_thread = threading.Thread(target=self.location_update_loop, daemon=True)
        self.location_thread.start()
        
        self.heartbeat_thread = threading.Thread(target=self.heartbeat_loop, daemon=True)
        self.heartbeat_thread.start()
        
        # Send initial location update
        self.send_location_update()
        
        print("Device agent started successfully")
        print("Press Ctrl+C to stop")
        
        try:
            # Keep GUI running for message dialogs
            self.root.mainloop()
        except KeyboardInterrupt:
            self.stop()
    
    def stop(self):
        """Stop the device agent"""
        print("Stopping device agent...")
        self.running = False
        
        if self.ws:
            self.ws.close()
        
        if self.root:
            self.root.quit()
        
        print("Device agent stopped")

def main():
    """Main entry point"""
    # Configuration - in production, load from config file
    config = {
        'server_url': 'http://localhost:3000',  # Your backend server
        'device_id': f"{platform.node()}-{int(time.time())}",  # Unique device ID
        'auth_token': 'your-auth-token-here'  # Authentication token
    }
    
    # Load config from file if it exists
    config_file = os.path.join(os.path.dirname(__file__), 'agent_config.json')
    if os.path.exists(config_file):
        with open(config_file, 'r') as f:
            file_config = json.load(f)
            config.update(file_config)
    
    # Create and start agent
    agent = DeviceAgent(
        server_url=config['server_url'],
        device_id=config['device_id'],
        auth_token=config['auth_token']
    )
    
    agent.start()

if __name__ == '__main__':
    main()
