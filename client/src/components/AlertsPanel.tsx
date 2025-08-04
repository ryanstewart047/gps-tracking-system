import React from 'react';
import {
  Box,
  List,
  ListItem,
  Chip,
  Typography,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  Warning,
  Error,
  Info,
  Battery1Bar,
  WifiOff,
  Schedule
} from '@mui/icons-material';

interface AlertItem {
  id: number;
  type: 'battery' | 'offline' | 'geofence' | 'emergency' | 'info';
  deviceId: string;
  message: string;
  timestamp: string;
  severity: 'error' | 'warning' | 'info' | 'success';
}

interface AlertsPanelProps {
  alerts: AlertItem[];
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts }) => {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'battery':
        return <Battery1Bar />;
      case 'offline':
        return <WifiOff />;
      case 'emergency':
        return <Error />;
      case 'geofence':
        return <Warning />;
      default:
        return <Info />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'success':
        return 'success';
      default:
        return 'info';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now.getTime() - alertTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  if (alerts.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
        <Info sx={{ fontSize: 48, opacity: 0.5 }} />
        <Typography variant="body2">
          No active alerts
        </Typography>
        <Typography variant="caption">
          All systems are running normally
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <List disablePadding>
        {alerts.map((alert) => (
          <ListItem key={alert.id} sx={{ px: 0, py: 1 }}>
            <Alert 
              severity={getAlertColor(alert.severity) as any}
              icon={getAlertIcon(alert.type)}
              sx={{ width: '100%' }}
            >
              <AlertTitle sx={{ fontSize: '0.9rem', mb: 1 }}>
                Device: {alert.deviceId}
              </AlertTitle>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {alert.message}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Chip
                  size="small"
                  label={alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                  color={getAlertColor(alert.severity) as any}
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Schedule sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {formatTimestamp(alert.timestamp)}
                  </Typography>
                </Box>
              </Box>
            </Alert>
          </ListItem>
        ))}
      </List>

      {/* Summary */}
      <Box sx={{ mt: 2, p: 2, backgroundColor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          Alert Summary
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            size="small"
            label={`${alerts.filter(a => a.severity === 'error').length} Critical`}
            color="error"
            variant={alerts.filter(a => a.severity === 'error').length > 0 ? 'filled' : 'outlined'}
          />
          <Chip
            size="small"
            label={`${alerts.filter(a => a.severity === 'warning').length} Warning`}
            color="warning"
            variant={alerts.filter(a => a.severity === 'warning').length > 0 ? 'filled' : 'outlined'}
          />
          <Chip
            size="small"
            label={`${alerts.filter(a => a.severity === 'info').length} Info`}
            color="info"
            variant={alerts.filter(a => a.severity === 'info').length > 0 ? 'filled' : 'outlined'}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default AlertsPanel;
