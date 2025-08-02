import express from 'express';

const router = express.Router();

// Notifications endpoints
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      data: [],
      message: 'Notifications functionality coming soon'
    });
  } catch (error) {
    console.error('Error in notifications route:', error);
    res.status(500).json({
      success: false,
      message: 'Notifications service unavailable'
    });
  }
});

export default router;