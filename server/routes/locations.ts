import { Router, Request, Response } from 'express';
import { LocationService } from '../services/LocationService';

const router = Router();
const locationService = new LocationService();

// @route   GET /api/locations/:deviceId
// @desc    Get location history for a device
// @access  Private
router.get('/:deviceId', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const locations = await locationService.getLocationHistory(deviceId, limit, offset);

    res.json({
      locations,
      count: locations.length,
      pagination: {
        limit,
        offset,
        hasMore: locations.length === limit
      }
    });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ error: 'Failed to retrieve locations' });
  }
});

// @route   GET /api/locations/:deviceId/current
// @desc    Get current location for a device
// @access  Private
router.get('/:deviceId/current', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    
    const location = await locationService.getCurrentLocation(deviceId);

    if (!location) {
      return res.status(404).json({ error: 'No location data found for this device' });
    }

    res.json({ location });
  } catch (error) {
    console.error('Get current location error:', error);
    res.status(500).json({ error: 'Failed to retrieve current location' });
  }
});

// @route   GET /api/locations/:deviceId/route
// @desc    Get route for a device within a time range
// @access  Private
router.get('/:deviceId/route', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { startTime, endTime } = req.query;

    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'Start time and end time are required' });
    }

    const start = new Date(startTime as string);
    const end = new Date(endTime as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const locations = await locationService.getLocationsByTimeRange(deviceId, start, end);
    const totalDistance = await locationService.calculateDistance(locations);

    res.json({
      route: locations,
      statistics: {
        totalPoints: locations.length,
        totalDistance: Math.round(totalDistance * 100) / 100, // Round to 2 decimal places
        startTime: start,
        endTime: end,
        duration: end.getTime() - start.getTime()
      }
    });
  } catch (error) {
    console.error('Get route error:', error);
    res.status(500).json({ error: 'Failed to retrieve route' });
  }
});

// @route   GET /api/locations/:deviceId/stats
// @desc    Get statistics for a device
// @access  Private
router.get('/:deviceId/stats', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const days = parseInt(req.query.days as string) || 7;

    const stats = await locationService.getLocationStats(deviceId, days);

    if (!stats) {
      return res.status(404).json({ error: 'No data found for statistics' });
    }

    res.json({ 
      statistics: stats,
      period: `${days} days`
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

// @route   GET /api/locations/:deviceId/offline
// @desc    Get offline data for a device
// @access  Private
router.get('/:deviceId/offline', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    
    const offlineData = await locationService.getOfflineData(deviceId);

    res.json({
      offlineData,
      count: offlineData.length
    });
  } catch (error) {
    console.error('Get offline data error:', error);
    res.status(500).json({ error: 'Failed to retrieve offline data' });
  }
});

export default router;
