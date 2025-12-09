const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address.controller');
const authMiddleware = require('../middlewares/auth');

// All routes require authentication and customer role
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('customer'));

// Address CRUD routes
router
  .route('/')
  .get(addressController.getAddresses)
  .post(addressController.addAddress);

router
  .route('/:addressId')
  .patch(addressController.updateAddress)
  .delete(addressController.deleteAddress);

router.patch('/:addressId/default', addressController.setDefaultAddress);

module.exports = router;
