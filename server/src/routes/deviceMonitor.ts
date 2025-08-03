import { Router } from 'express';
import { DeviceMonitorController } from '../controllers/DeviceMonitorController';
import { WebSocketService } from '../services/WebSocketService';

export function createDeviceMonitorRoutes(wsService: WebSocketService): Router {
  const router = Router();
  const controller = new DeviceMonitorController(wsService);

  // Device management routes
  router.get('/devices', controller.getAllDevices.bind(controller));
  router.get('/devices/stats', controller.getDeviceStats.bind(controller));
  router.get('/devices/:deviceId', controller.getDevice.bind(controller));
  router.post('/devices/location', controller.updateDeviceLocation.bind(controller));
  
  // Device control routes
  router.post('/devices/:deviceId/command', controller.sendCommand.bind(controller));
  router.post('/devices/:deviceId/message', controller.sendMessage.bind(controller));
  router.post('/devices/:deviceId/lock', controller.lockDevice.bind(controller));
  
  // Device alerts and settings
  router.get('/devices/:deviceId/alerts', controller.getDeviceAlerts.bind(controller));
  router.put('/devices/:deviceId/settings', controller.updateDeviceSettings.bind(controller));

  return router;
}
