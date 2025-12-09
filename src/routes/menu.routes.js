const express = require('express');
const menuController = require('../controllers/menu.controller');
const authMiddleware = require('../middlewares/auth');
const menuValidator = require('../validators/menu.validator');
const { cacheMiddleware } = require('../middlewares/cache');

const router = express.Router();

/**
 * Public routes - No authentication required
 */

// Get popular items (must be before /:id) - Cache for 10 minutes
router.get('/popular/items', cacheMiddleware(600, 'menu'), menuController.getPopularItems);

// Get all categories (must be before /:id) - Cache for 15 minutes
router.get('/categories/all', cacheMiddleware(900, 'menu'), menuController.getAllCategories);

// Get menu items by category (must be before /:id) - Cache for 5 minutes
router.get('/category/:category', cacheMiddleware(300, 'menu'), menuController.getMenuItemsByCategory);

// Get menu item by slug (must be before /:id) - Cache for 10 minutes
router.get('/slug/:slug', cacheMiddleware(600, 'menu'), menuController.getMenuItemBySlug);

// Get all menu items with filtering, sorting, pagination - Cache for 5 minutes
router.get(
  '/',
  cacheMiddleware(300, 'menu'),
  menuValidator.validateQuery(menuValidator.menuQuerySchema),
  menuController.getAllMenuItems
);

// Get menu item by ID - Cache for 10 minutes
router.get('/:id', cacheMiddleware(600, 'menu'), menuController.getMenuItem);

/**
 * Protected routes - Admin only
 * All routes below require authentication and admin role
 */
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('admin'));

// Get menu statistics (must be before /:id)
router.get('/stats/overview', menuController.getMenuStats);

// Create new menu item
router.post(
  '/',
  menuValidator.validate(menuValidator.createMenuItemSchema),
  menuController.createMenuItem
);

// Update menu item
router.patch(
  '/:id',
  menuValidator.validate(menuValidator.updateMenuItemSchema),
  menuController.updateMenuItem
);

// Update availability
router.patch(
  '/:id/availability',
  menuValidator.validate(menuValidator.updateAvailabilitySchema),
  menuController.updateAvailability
);

// Restore deleted menu item
router.patch('/:id/restore', menuController.restoreMenuItem);

// Soft delete menu item
router.delete('/:id', menuController.deleteMenuItem);

// Permanently delete menu item
router.delete('/:id/permanent', menuController.permanentlyDeleteMenuItem);

module.exports = router;
