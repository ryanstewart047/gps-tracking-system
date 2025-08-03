import { Router, Request, Response } from 'express';
import { Device } from '../models/Device';

const router = Router();

// @route   GET /api/devices
// @desc    Get all devices for authenticated user
// @access  Private
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || req.user?._id;
    
    const devices = await Device.find({ userId })
      .sort({ createdAt: -1 });

    res.json({
      devices,
      count: devices.length
    });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Failed to retrieve devices' });
  }
});

// @route   POST /api/devices
// @desc    Add a new device
// @access  Private
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { deviceId, name, metadata } = req.body;

    if (!deviceId || !name) {
      return res.status(400).json({ error: 'Device ID and name are required' });
    }

    // Check if device already exists
    const existingDevice = await Device.findOne({ deviceId });
    if (existingDevice) {
      return res.status(400).json({ error: 'Device already exists' });
    }

    const device = new Device({
      deviceId,
      name,
      userId,
      metadata: metadata || {}
    });

    await device.save();

    res.status(201).json({
      message: 'Device added successfully',
      device
    });
  } catch (error) {
    console.error('Add device error:', error);
    res.status(500).json({ error: 'Failed to add device' });
  }
});

// @route   GET /api/devices/:id
// @desc    Get single device
// @access  Private
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const device = await Device.findOne({ 
      deviceId: req.params.id, 
      userId 
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json({ device });
  } catch (error) {
    console.error('Get device error:', error);
    res.status(500).json({ error: 'Failed to retrieve device' });
  }
});

// @route   PUT /api/devices/:id
// @desc    Update device
// @access  Private
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { name, settings, metadata } = req.body;

    const device = await Device.findOneAndUpdate(
      { deviceId: req.params.id, userId },
      { 
        $set: {
          ...(name && { name }),
          ...(settings && { settings }),
          ...(metadata && { metadata }),
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json({
      message: 'Device updated successfully',
      device
    });
  } catch (error) {
    console.error('Update device error:', error);
    res.status(500).json({ error: 'Failed to update device' });
  }
});

// @route   DELETE /api/devices/:id
// @desc    Delete device
// @access  Private
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || req.user?._id;
    
    const device = await Device.findOneAndDelete({ 
      deviceId: req.params.id, 
      userId 
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

export default router;
