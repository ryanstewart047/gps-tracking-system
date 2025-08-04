import React, { useEffect, useRef } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { LocationOn, Battery3Bar, SignalCellular4Bar } from '@mui/icons-material';

interface Device {
  id: string;
  name: string;
  isOnline: boolean;
  battery: number;
  signal: number;
  latitude: number;
  longitude: number;
  lastUpdate: string;
}

interface MapViewProps {
  devices: Device[];
}

const MapView: React.FC<MapViewProps> = ({ devices }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  // For now, we'll create a simple map-like interface
  // In a real implementation, you would use react-leaflet or Google Maps
  
  useEffect(() => {
    // Initialize map (placeholder)
    console.log('Map initialized with devices:', devices);
  }, [devices]);

  return (
    <Box 
      ref={mapRef}
      sx={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        background: 'linear-gradient(45deg, #e8f5e8 0%, #c8e6c9 100%)',
        borderRadius: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      {/* Map Placeholder */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />
      
      {/* Map Title */}
      <Typography 
        variant="h6" 
        sx={{ 
          position: 'absolute',
          top: 16,
          left: 16,
          background: 'rgba(255,255,255,0.9)',
          px: 2,
          py: 1,
          borderRadius: 1,
          boxShadow: 1
        }}
      >
        📍 Live GPS Tracking Map
      </Typography>

      {/* Device Markers */}
      {devices.map((device, index) => (
        <Box
          key={device.id}
          sx={{
            position: 'absolute',
            left: `${20 + index * 150}px`,
            top: `${100 + index * 80}px`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'scale(1.1)',
            }
          }}
        >
          {/* Device Marker */}
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: device.isOnline 
                ? 'linear-gradient(45deg, #4caf50, #66bb6a)'
                : 'linear-gradient(45deg, #f44336, #ef5350)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 3,
              border: '3px solid white',
              animation: device.isOnline ? 'pulse 2s infinite' : 'none',
            }}
          >
            <LocationOn sx={{ color: 'white', fontSize: 20 }} />
          </Box>

          {/* Device Info Popup */}
          <Box
            sx={{
              mt: 1,
              background: 'rgba(255,255,255,0.95)',
              borderRadius: 1,
              p: 1,
              boxShadow: 2,
              minWidth: 140,
              textAlign: 'center',
              border: '1px solid rgba(0,0,0,0.1)'
            }}
          >
            <Typography variant="caption" fontWeight="bold" display="block">
              {device.name}
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
              <Chip 
                size="small" 
                label={device.isOnline ? 'Online' : 'Offline'}
                color={device.isOnline ? 'success' : 'error'}
                sx={{ fontSize: '0.6rem', height: 16 }}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Battery3Bar sx={{ fontSize: 12, color: device.battery > 20 ? 'green' : 'red' }} />
                <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                  {Math.round(device.battery)}%
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SignalCellular4Bar sx={{ fontSize: 12, color: device.signal > 50 ? 'green' : 'orange' }} />
                <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                  {Math.round(device.signal)}%
                </Typography>
              </Box>
            </Box>

            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
              {device.latitude.toFixed(4)}, {device.longitude.toFixed(4)}
            </Typography>
          </Box>
        </Box>
      ))}

      {/* Map Legend */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          background: 'rgba(255,255,255,0.9)',
          p: 2,
          borderRadius: 1,
          boxShadow: 1
        }}
      >
        <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>
          Legend
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              width: 12, 
              height: 12, 
              borderRadius: '50%', 
              background: 'linear-gradient(45deg, #4caf50, #66bb6a)' 
            }} />
            <Typography variant="caption">Online Device</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              width: 12, 
              height: 12, 
              borderRadius: '50%', 
              background: 'linear-gradient(45deg, #f44336, #ef5350)' 
            }} />
            <Typography variant="caption">Offline Device</Typography>
          </Box>
        </Box>
      </Box>

      {/* Instructions */}
      {devices.length === 0 && (
        <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
          <LocationOn sx={{ fontSize: 48, opacity: 0.5 }} />
          <Typography variant="body2">
            No devices to display
          </Typography>
          <Typography variant="caption">
            Add GPS tracking devices to see them on the map
          </Typography>
        </Box>
      )}

      <style>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
          }
        }
      `}</style>
    </Box>
  );
};

export default MapView;
