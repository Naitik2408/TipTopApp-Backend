const Joi = require('joi');

/**
 * Validation schema for adding/updating address
 * Must match frontend validation in AddAddressScreen.tsx
 */
const addressSchema = Joi.object({
  type: Joi.string().valid('home', 'work', 'other').required().messages({
    'any.only': 'Address type must be home, work, or other',
    'any.required': 'Address type is required',
  }),
  label: Joi.string().trim().max(50).allow('').optional().messages({
    'string.max': 'Label is too long (max 50 characters)',
  }),
  street: Joi.string().trim().min(5).max(200).required().messages({
    'string.empty': 'Street address is required',
    'string.min': 'Street address must be at least 5 characters',
    'string.max': 'Street address is too long (max 200 characters)',
  }),
  apartment: Joi.string().trim().max(100).allow('').optional().messages({
    'string.max': 'Apartment info is too long (max 100 characters)',
  }),
  city: Joi.string().trim().min(2).max(50).pattern(/^[a-zA-Z\s]+$/).required().messages({
    'string.empty': 'City is required',
    'string.min': 'City name must be at least 2 characters',
    'string.max': 'City name is too long (max 50 characters)',
    'string.pattern.base': 'City name should only contain letters',
  }),
  state: Joi.string().trim().min(2).max(50).pattern(/^[a-zA-Z\s]+$/).required().messages({
    'string.empty': 'State is required',
    'string.min': 'State name must be at least 2 characters',
    'string.max': 'State name is too long (max 50 characters)',
    'string.pattern.base': 'State name should only contain letters',
  }),
  zipCode: Joi.string().pattern(/^\d{6}$/).required().messages({
    'string.empty': 'Zip code is required',
    'string.pattern.base': 'Zip code must be exactly 6 digits',
  }),
  landmark: Joi.string().trim().max(100).allow('').optional().messages({
    'string.max': 'Landmark is too long (max 100 characters)',
  }),
  isDefault: Joi.boolean().optional(),
});

/**
 * Validation middleware for add address
 */
exports.validateAddAddress = (req, res, next) => {
  const { error } = addressSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

/**
 * Validation middleware for update address
 * All fields are optional for updates
 */
exports.validateUpdateAddress = (req, res, next) => {
  const updateSchema = Joi.object({
    type: Joi.string().valid('home', 'work', 'other').optional().messages({
      'any.only': 'Address type must be home, work, or other',
    }),
    label: Joi.string().trim().max(50).allow('').optional().messages({
      'string.max': 'Label is too long (max 50 characters)',
    }),
    street: Joi.string().trim().min(5).max(200).optional().messages({
      'string.min': 'Street address must be at least 5 characters',
      'string.max': 'Street address is too long (max 200 characters)',
    }),
    apartment: Joi.string().trim().max(100).allow('').optional().messages({
      'string.max': 'Apartment info is too long (max 100 characters)',
    }),
    city: Joi.string().trim().min(2).max(50).pattern(/^[a-zA-Z\s]+$/).optional().messages({
      'string.min': 'City name must be at least 2 characters',
      'string.max': 'City name is too long (max 50 characters)',
      'string.pattern.base': 'City name should only contain letters',
    }),
    state: Joi.string().trim().min(2).max(50).pattern(/^[a-zA-Z\s]+$/).optional().messages({
      'string.min': 'State name must be at least 2 characters',
      'string.max': 'State name is too long (max 50 characters)',
      'string.pattern.base': 'State name should only contain letters',
    }),
    zipCode: Joi.string().pattern(/^\d{6}$/).optional().messages({
      'string.pattern.base': 'Zip code must be exactly 6 digits',
    }),
    landmark: Joi.string().trim().max(100).allow('').optional().messages({
      'string.max': 'Landmark is too long (max 100 characters)',
    }),
    isDefault: Joi.boolean().optional(),
  });

  const { error } = updateSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors,
    });
  }

  next();
};
