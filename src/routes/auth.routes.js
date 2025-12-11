const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth');
const authValidator = require('../validators/auth.validator');

const router = express.Router();

/**
 * Public routes - No authentication required
 */

// Register new user
router.post(
  '/register',
  authValidator.validate(authValidator.registerSchema),
  authController.register
);

// Login user
router.post(
  '/login',
  authValidator.validate(authValidator.loginSchema),
  authController.login
);

// Refresh access token
router.post(
  '/refresh-token',
  authValidator.validate(authValidator.refreshTokenSchema),
  authController.refreshToken
);

// Forgot password - Request reset token
router.post(
  '/forgot-password',
  authValidator.validate(authValidator.forgotPasswordSchema),
  authController.forgotPassword
);

// Reset password with token
router.patch(
  '/reset-password/:token',
  authValidator.validate(authValidator.resetPasswordSchema),
  authController.resetPassword
);

// Verify email with token (legacy - for URL-based verification)
router.get('/verify-email/:token', authController.verifyEmail);

// Verify email with OTP
router.post('/verify-otp', authController.verifyOTP);

// Resend OTP
router.post('/resend-otp', authController.resendOTP);

/**
 * Protected routes - Authentication required
 * All routes below this middleware require a valid JWT token
 */
router.use(authMiddleware.protect);

// Logout user
router.post('/logout', authController.logout);

// Get current user profile
router.get('/me', authController.getMe);

// Update current user profile
router.patch(
  '/me',
  authValidator.validate(authValidator.updateProfileSchema),
  authController.updateMe
);

// Deactivate current user account
router.delete(
  '/me',
  authValidator.validate(authValidator.deleteAccountSchema),
  authController.deleteMe
);

// Get user's frequently ordered items (customer only)
router.get('/me/frequently-ordered', 
  authMiddleware.restrictTo('customer'),
  authController.getFrequentlyOrdered
);

// Get user's favorite items (customer only)
router.get('/me/favorites',
  authMiddleware.restrictTo('customer'),
  require('../controllers/user.controller').getFavoriteItems
);

// Add item to favorites (customer only)
router.post('/me/favorites/:menuItemId',
  authMiddleware.restrictTo('customer'),
  require('../controllers/user.controller').addFavoriteItem
);

// Remove item from favorites (customer only)
router.delete('/me/favorites/:menuItemId',
  authMiddleware.restrictTo('customer'),
  require('../controllers/user.controller').removeFavoriteItem
);

// Change password
router.patch(
  '/change-password',
  authValidator.validate(authValidator.changePasswordSchema),
  authController.changePassword
);

// Send email verification link
router.post('/send-verification-email', authController.sendVerificationEmail);

// Send phone verification OTP
router.post('/send-verification-sms', authController.sendVerificationSMS);

// Verify phone with OTP
router.post(
  '/verify-phone',
  authValidator.validate(authValidator.verifyPhoneSchema),
  authController.verifyPhone
);

// Register/Update device token for push notifications
router.post('/device-token', authController.registerDeviceToken);

// Remove device token
router.delete('/device-token', authController.removeDeviceToken);

module.exports = router;
