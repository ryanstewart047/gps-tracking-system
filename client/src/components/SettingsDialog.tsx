import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Alert
} from '@mui/material';
import {
  Settings,
  Notifications,
  Map,
  Security,
  LocationOn
} from '@mui/icons-material';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose }) => {
  const [settings, setSettings] = useState({
    // Notification Settings
    enableNotifications: true,
    emailAlerts: true,
    smsAlerts: false,
    lowBatteryThreshold: 20,
    offlineAlertDelay: 5, // minutes
    
    // Map Settings
    mapProvider: 'openstreetmap', // 'google', 'mapbox', 'openstreetmap'
    defaultZoom: 13,
    trackingInterval: 30, // seconds
    showTrails: true,
    trailLength: 24, // hours
    
    // Device Settings
    autoRefresh: true,
    refreshInterval: 10, // seconds
    gpsAccuracy: 'high', // 'low', 'medium', 'high'
    
    // Security Settings
    requireAuth: true,
    sessionTimeout: 60, // minutes
    encryptData: true,
    
    // API Settings
    apiEndpoint: 'http://localhost:5000/api',
    mqttBroker: 'mqtt://localhost:1883',
    apiKey: ''
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // Save settings to localStorage or backend
    localStorage.setItem('gps_tracking_settings', JSON.stringify(settings));
    console.log('Settings saved:', settings);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Settings sx={{ mr: 1 }} />
          GPS Tracking System Settings
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          {/* Notification Settings */}
          <Box>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Notifications sx={{ mr: 1 }} />
              Notifications
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, ml: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableNotifications}
                    onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
                  />
                }
                label="Enable Notifications"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailAlerts}
                    onChange={(e) => handleSettingChange('emailAlerts', e.target.checked)}
                  />
                }
                label="Email Alerts"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.smsAlerts}
                    onChange={(e) => handleSettingChange('smsAlerts', e.target.checked)}
                  />
                }
                label="SMS Alerts"
              />
              
              <Box>
                <Typography gutterBottom>
                  Low Battery Threshold: {settings.lowBatteryThreshold}%
                </Typography>
                <Slider
                  value={settings.lowBatteryThreshold}
                  onChange={(_, value) => handleSettingChange('lowBatteryThreshold', value)}
                  min={5}
                  max={50}
                  step={5}
                  marks
                  valueLabelDisplay="auto"
                />
              </Box>
              
              <TextField
                label="Offline Alert Delay (minutes)"
                type="number"
                value={settings.offlineAlertDelay}
                onChange={(e) => handleSettingChange('offlineAlertDelay', parseInt(e.target.value))}
                size="small"
                sx={{ maxWidth: 200 }}
              />
            </Box>
          </Box>

          <Divider />

          {/* Map Settings */}
          <Box>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Map sx={{ mr: 1 }} />
              Map Configuration
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, ml: 2 }}>
              <FormControl size="small" sx={{ maxWidth: 200 }}>
                <InputLabel>Map Provider</InputLabel>
                <Select
                  value={settings.mapProvider}
                  label="Map Provider"
                  onChange={(e) => handleSettingChange('mapProvider', e.target.value)}
                >
                  <MenuItem value="openstreetmap">OpenStreetMap</MenuItem>
                  <MenuItem value="google">Google Maps</MenuItem>
                  <MenuItem value="mapbox">Mapbox</MenuItem>
                </Select>
              </FormControl>
              
              <Box>
                <Typography gutterBottom>
                  Default Zoom Level: {settings.defaultZoom}
                </Typography>
                <Slider
                  value={settings.defaultZoom}
                  onChange={(_, value) => handleSettingChange('defaultZoom', value)}
                  min={1}
                  max={20}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
                />
              </Box>
              
              <TextField
                label="Tracking Interval (seconds)"
                type="number"
                value={settings.trackingInterval}
                onChange={(e) => handleSettingChange('trackingInterval', parseInt(e.target.value))}
                size="small"
                sx={{ maxWidth: 200 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showTrails}
                    onChange={(e) => handleSettingChange('showTrails', e.target.checked)}
                  />
                }
                label="Show Movement Trails"
              />
              
              <TextField
                label="Trail Length (hours)"
                type="number"
                value={settings.trailLength}
                onChange={(e) => handleSettingChange('trailLength', parseInt(e.target.value))}
                size="small"
                sx={{ maxWidth: 200 }}
                disabled={!settings.showTrails}
              />
            </Box>
          </Box>

          <Divider />

          {/* Device Settings */}
          <Box>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LocationOn sx={{ mr: 1 }} />
              Device Tracking
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, ml: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoRefresh}
                    onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
                  />
                }
                label="Auto Refresh"
              />
              
              <TextField
                label="Refresh Interval (seconds)"
                type="number"
                value={settings.refreshInterval}
                onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
                size="small"
                sx={{ maxWidth: 200 }}
                disabled={!settings.autoRefresh}
              />
              
              <FormControl size="small" sx={{ maxWidth: 200 }}>
                <InputLabel>GPS Accuracy</InputLabel>
                <Select
                  value={settings.gpsAccuracy}
                  label="GPS Accuracy"
                  onChange={(e) => handleSettingChange('gpsAccuracy', e.target.value)}
                >
                  <MenuItem value="low">Low (Battery Saving)</MenuItem>
                  <MenuItem value="medium">Medium (Balanced)</MenuItem>
                  <MenuItem value="high">High (Precise)</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Divider />

          {/* API Settings */}
          <Box>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Security sx={{ mr: 1 }} />
              API Configuration
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, ml: 2 }}>
              <TextField
                label="API Endpoint"
                value={settings.apiEndpoint}
                onChange={(e) => handleSettingChange('apiEndpoint', e.target.value)}
                size="small"
                fullWidth
              />
              
              <TextField
                label="MQTT Broker"
                value={settings.mqttBroker}
                onChange={(e) => handleSettingChange('mqttBroker', e.target.value)}
                size="small"
                fullWidth
              />
              
              <TextField
                label="API Key (Optional)"
                type="password"
                value={settings.apiKey}
                onChange={(e) => handleSettingChange('apiKey', e.target.value)}
                size="small"
                fullWidth
              />
            </Box>
          </Box>

          <Alert severity="info">
            <Typography variant="body2">
              <strong>Hardware Setup Required:</strong> To track real devices, you need GPS/GSM modules 
              (like NEO-6M + SIM800L) programmed with our Arduino firmware. 
              Each device will automatically connect and send location data.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;
