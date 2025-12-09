const Settings = require('../models/Settings');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * @desc    Get settings
 * @route   GET /api/v1/settings
 * @access  Public (or Admin if you want to restrict)
 */
exports.getSettings = catchAsync(async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();

    res.status(200).json({
      success: true,
      data: {
        settings,
      },
    });
  } catch (error) {
    logger.error('Error in getSettings:', error);
    return next(new AppError('Failed to fetch settings', 500));
  }
});

/**
 * @desc    Update settings
 * @route   PUT /api/v1/settings
 * @access  Admin only
 */
exports.updateSettings = catchAsync(async (req, res, next) => {
  const {
    siteName,
    contactEmail,
    contactPhone,
    notificationEmails,
    minimumOrderAmount,
    taxRate,
    deliveryCharge,
    upiId,
  } = req.body;

  // Get the singleton settings document
  const settings = await Settings.getSettings();

  // Update fields if provided
  if (siteName !== undefined) settings.siteName = siteName;
  if (contactEmail !== undefined) settings.contactEmail = contactEmail;
  if (contactPhone !== undefined) settings.contactPhone = contactPhone;
  if (notificationEmails !== undefined) settings.notificationEmails = notificationEmails;
  if (minimumOrderAmount !== undefined) settings.minimumOrderAmount = minimumOrderAmount;
  if (taxRate !== undefined) settings.taxRate = taxRate;
  if (deliveryCharge !== undefined) settings.deliveryCharge = deliveryCharge;
  if (upiId !== undefined) settings.upiId = upiId;

  await settings.save();

  res.status(200).json({
    success: true,
    message: 'Settings updated successfully',
    data: {
      settings,
    },
  });
});
