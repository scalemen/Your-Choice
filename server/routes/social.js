import express from 'express';

const router = express.Router();

// Social endpoints placeholder
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      data: [],
      message: 'Social functionality available in enhanced-social route'
    });
  } catch (error) {
    console.error('Error in social route:', error);
    res.status(500).json({
      success: false,
      message: 'Social service unavailable'
    });
  }
});

export default router;