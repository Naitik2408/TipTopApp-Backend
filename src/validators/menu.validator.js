const Joi = require('joi');

/**
 * Validation schema for creating a menu item
 */
exports.createMenuItemSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).required().messages({
    'string.empty': 'Menu item name is required',
    'string.min': 'Name must be at least 3 characters',
    'string.max': 'Name cannot exceed 100 characters',
  }),

  description: Joi.string().trim().min(10).max(1000).required().messages({
    'string.empty': 'Description is required',
    'string.min': 'Description must be at least 10 characters',
    'string.max': 'Description cannot exceed 1000 characters',
  }),

  price: Joi.number().min(0).required().messages({
    'number.base': 'Price must be a number',
    'number.min': 'Price cannot be negative',
    'any.required': 'Price is required',
  }),

  image: Joi.string().uri().required().messages({
    'string.empty': 'Image URL is required',
    'string.uri': 'Please provide a valid image URL',
  }),

  images: Joi.array().items(Joi.string().uri()).max(5).messages({
    'array.max': 'Maximum 5 images allowed',
  }),

  category: Joi.object({
    main: Joi.string()
      .required()
      .messages({
        'string.empty': 'Main category is required',
      }),
    sub: Joi.array().items(Joi.string()).messages({
      'array.base': 'Sub-categories must be an array of strings',
    }),
    tags: Joi.array().items(Joi.string()).max(10).messages({
      'array.max': 'Maximum 10 tags allowed',
    }),
  }).required(),

  plateQuantity: Joi.string()
    .valid('Full', 'Half', 'Quarter')
    .default('Full')
    .messages({
      'any.only': 'Plate quantity must be Full, Half, or Quarter',
    }),

  isVegetarian: Joi.boolean().default(true),

  isAvailable: Joi.boolean().default(true),

  prepTime: Joi.number().integer().min(1).max(180).required().messages({
    'number.base': 'Preparation time must be a number',
    'number.min': 'Preparation time must be at least 1 minute',
    'number.max': 'Preparation time cannot exceed 180 minutes',
    'any.required': 'Preparation time is required',
  }),

  spiceLevel: Joi.string()
    .valid('mild', 'medium', 'hot', 'extra-hot')
    .default('medium')
    .messages({
      'any.only': 'Spice level must be mild, medium, hot, or extra-hot',
    }),

  servingSize: Joi.string().trim().max(50).messages({
    'string.max': 'Serving size cannot exceed 50 characters',
  }),

  calories: Joi.number().integer().min(0).messages({
    'number.base': 'Calories must be a number',
    'number.min': 'Calories cannot be negative',
  }),

  allergens: Joi.array().items(Joi.string()).max(20).messages({
    'array.max': 'Maximum 20 allergens allowed',
  }),

  ingredients: Joi.array().items(Joi.string()).max(50).messages({
    'array.max': 'Maximum 50 ingredients allowed',
  }),

  nutritionalInfo: Joi.object({
    protein: Joi.number().min(0),
    carbs: Joi.number().min(0),
    fat: Joi.number().min(0),
    fiber: Joi.number().min(0),
  }),

  customizations: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      type: Joi.string().valid('single', 'multiple').default('single'),
      required: Joi.boolean().default(false),
      options: Joi.array()
        .items(
          Joi.object({
            name: Joi.string().required(),
            price: Joi.number().min(0).default(0),
          })
        )
        .min(1)
        .required(),
    })
  ),

  variants: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      price: Joi.number().min(0).required(),
      isAvailable: Joi.boolean().default(true),
    })
  ),

  dietaryTags: Joi.array()
    .items(
      Joi.string().valid(
        'vegan',
        'gluten-free',
        'dairy-free',
        'nut-free',
        'low-carb',
        'keto',
        'halal',
        'jain'
      )
    )
    .unique(),

  maxOrderQuantity: Joi.number().integer().min(1).default(10).messages({
    'number.min': 'Maximum order quantity must be at least 1',
  }),
});

/**
 * Validation schema for updating a menu item
 */
exports.updateMenuItemSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).messages({
    'string.min': 'Name must be at least 3 characters',
    'string.max': 'Name cannot exceed 100 characters',
  }),

  description: Joi.string().trim().min(10).max(1000).messages({
    'string.min': 'Description must be at least 10 characters',
    'string.max': 'Description cannot exceed 1000 characters',
  }),

  price: Joi.number().min(0).messages({
    'number.min': 'Price cannot be negative',
  }),

  image: Joi.string().uri().messages({
    'string.uri': 'Please provide a valid image URL',
  }),

  images: Joi.array().items(Joi.string().uri()).max(5).messages({
    'array.max': 'Maximum 5 images allowed',
  }),

  category: Joi.object({
    main: Joi.string(),
    sub: Joi.array().items(Joi.string()),
    tags: Joi.array().items(Joi.string()).max(10),
  }),

  plateQuantity: Joi.string()
    .valid('Full', 'Half', 'Quarter')
    .messages({
      'any.only': 'Plate quantity must be Full, Half, or Quarter',
    }),

  isVegetarian: Joi.boolean(),
  isAvailable: Joi.boolean(),

  prepTime: Joi.number().integer().min(1).max(180).messages({
    'number.min': 'Preparation time must be at least 1 minute',
    'number.max': 'Preparation time cannot exceed 180 minutes',
  }),

  spiceLevel: Joi.string()
    .valid('mild', 'medium', 'hot', 'extra-hot')
    .messages({
      'any.only': 'Spice level must be mild, medium, hot, or extra-hot',
    }),

  servingSize: Joi.string().trim().max(50),
  calories: Joi.number().integer().min(0),
  allergens: Joi.array().items(Joi.string()).max(20),
  ingredients: Joi.array().items(Joi.string()).max(50),

  nutritionalInfo: Joi.object({
    protein: Joi.number().min(0),
    carbs: Joi.number().min(0),
    fat: Joi.number().min(0),
    fiber: Joi.number().min(0),
  }),

  customizations: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      type: Joi.string().valid('single', 'multiple').default('single'),
      required: Joi.boolean().default(false),
      options: Joi.array()
        .items(
          Joi.object({
            name: Joi.string().required(),
            price: Joi.number().min(0).default(0),
          })
        )
        .min(1)
        .required(),
    })
  ),

  variants: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      price: Joi.number().min(0).required(),
      isAvailable: Joi.boolean().default(true),
    })
  ),

  dietaryTags: Joi.array()
    .items(
      Joi.string().valid(
        'vegan',
        'gluten-free',
        'dairy-free',
        'nut-free',
        'low-carb',
        'keto',
        'halal',
        'jain'
      )
    )
    .unique(),

  maxOrderQuantity: Joi.number().integer().min(1),

  // Prevent updating certain fields
  slug: Joi.forbidden(),
  stats: Joi.forbidden(),
  rating: Joi.forbidden(),
  reviewCount: Joi.forbidden(),
});

/**
 * Validation schema for updating availability
 */
exports.updateAvailabilitySchema = Joi.object({
  isAvailable: Joi.boolean().required().messages({
    'any.required': 'isAvailable field is required',
    'boolean.base': 'isAvailable must be a boolean',
  }),
});

/**
 * Validation schema for menu query parameters
 */
exports.menuQuerySchema = Joi.object({
  // Pagination
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),

  // Sorting
  sort: Joi.string().pattern(/^-?[\w,.-]+$/),

  // Field limiting
  fields: Joi.string().pattern(/^[\w,.-]+$/),

  // Search
  search: Joi.string().trim().max(100),

  // Filtering
  category: Joi.string(),
  isVegetarian: Joi.boolean(),
  isAvailable: Joi.boolean(),
  spiceLevel: Joi.string().valid('mild', 'medium', 'hot', 'extra-hot'),
  plateQuantity: Joi.string().valid('Full', 'Half', 'Quarter'),
  
  // Price range
  'price[gte]': Joi.number().min(0),
  'price[lte]': Joi.number().min(0),
  'price[gt]': Joi.number().min(0),
  'price[lt]': Joi.number().min(0),

  // Rating range
  'rating[gte]': Joi.number().min(0).max(5),
  'rating[lte]': Joi.number().min(0).max(5),

  // Prep time range
  'prepTime[lte]': Joi.number().min(0),
  'prepTime[gte]': Joi.number().min(0),

  // Dietary tags
  dietaryTags: Joi.string(), // Can be comma-separated

  // Allow unknown query parameters for MongoDB operators
}).unknown(true);

/**
 * Middleware to validate request body
 */
exports.validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        status: 'fail',
        message: 'Validation error',
        errors,
      });
    }

    req.body = value;
    next();
  };
};

/**
 * Middleware to validate query parameters
 */
exports.validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: false,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        status: 'fail',
        message: 'Query validation error',
        errors,
      });
    }

    req.query = value;
    next();
  };
};
