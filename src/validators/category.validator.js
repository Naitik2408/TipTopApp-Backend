const Joi = require('joi');

// Validation for creating a category
exports.createCategorySchema = {
  body: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.empty': 'Category name is required',
        'string.min': 'Category name must be at least 2 characters',
        'string.max': 'Category name cannot exceed 50 characters',
      }),
    description: Joi.string()
      .max(200)
      .allow('')
      .optional()
      .messages({
        'string.max': 'Description cannot exceed 200 characters',
      }),
    isActive: Joi.boolean()
      .optional()
      .default(true),
    color: Joi.string()
      .valid('green', 'red', 'blue', 'purple', 'orange', 'pink', 'yellow')
      .optional(),
  }),
};

// Validation for updating a category
exports.updateCategorySchema = {
  body: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .optional()
      .messages({
        'string.min': 'Category name must be at least 2 characters',
        'string.max': 'Category name cannot exceed 50 characters',
      }),
    description: Joi.string()
      .max(200)
      .allow('')
      .optional()
      .messages({
        'string.max': 'Description cannot exceed 200 characters',
      }),
    isActive: Joi.boolean()
      .optional(),
    color: Joi.string()
      .valid('green', 'red', 'blue', 'purple', 'orange', 'pink', 'yellow')
      .optional(),
  }),
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid category ID format',
      }),
  }),
};

// Validation for getting category by ID
exports.getCategoryByIdSchema = {
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid category ID format',
      }),
  }),
};

// Validation for query parameters
exports.getCategoriesSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sort: Joi.string().optional(),
    fields: Joi.string().optional(),
    isActive: Joi.boolean().optional(),
    name: Joi.string().optional(),
  }),
};

/**
 * Middleware to validate request
 */
exports.validate = (schema) => {
  return (req, res, next) => {
    const validationTargets = ['body', 'query', 'params'];
    const errors = [];

    for (const target of validationTargets) {
      if (schema[target]) {
        const { error } = schema[target].validate(req[target], {
          abortEarly: false,
          stripUnknown: true,
        });

        if (error) {
          errors.push(...error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            location: target,
          })));
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Validation error',
        errors,
      });
    }

    next();
  };
};
