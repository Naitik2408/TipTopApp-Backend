const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settings.controller');
const authMiddleware = require('../middlewares/auth');

// Public route to get settings
router.get('/', getSettings);

// Admin only route to update settings
router.put('/', authMiddleware.protect, authMiddleware.restrictTo('admin'), updateSettings);

module.exports = router;
