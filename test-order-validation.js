/**
 * Order Placement Validation Test Suite
 * Tests to ensure order validation works correctly with various inputs
 * Run: node test-order-validation.js
 */

const Joi = require('joi');

// Backend validation schema (from order.validator.js)
const orderSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        menuItem: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/)
          .required()
          .messages({
            'string.empty': 'Menu item ID is required',
            'string.pattern.base': 'Invalid menu item ID',
          }),
        quantity: Joi.number().integer().min(1).max(50).required().messages({
          'number.min': 'Quantity must be at least 1',
          'number.max': 'Quantity cannot exceed 50',
          'any.required': 'Quantity is required',
        }),
        price: Joi.number().min(0).optional(),
        specialInstructions: Joi.string().trim().max(200).allow('').optional().messages({
          'string.max': 'Special instructions cannot exceed 200 characters',
        }),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one item is required',
      'any.required': 'Order items are required',
    }),

  deliveryAddress: Joi.object({
    street: Joi.string().trim().min(5).max(200).required().messages({
      'string.empty': 'Street address is required',
      'string.min': 'Street address must be at least 5 characters',
      'string.max': 'Street address is too long (max 200 characters)',
    }),
    apartment: Joi.string().trim().max(100).allow('').optional(),
    city: Joi.string().trim().min(2).max(50).pattern(/^[a-zA-Z\s]+$/).required().messages({
      'string.empty': 'City is required',
      'string.pattern.base': 'City name should only contain letters',
    }),
    state: Joi.string().trim().min(2).max(50).pattern(/^[a-zA-Z\s]+$/).required().messages({
      'string.empty': 'State is required',
      'string.pattern.base': 'State name should only contain letters',
    }),
    zipCode: Joi.string()
      .pattern(/^\d{6}$/)
      .required()
      .messages({
        'string.empty': 'Zip code is required',
        'string.pattern.base': 'Please provide a valid 6-digit zip code',
      }),
    landmark: Joi.string().trim().max(100).allow('').optional(),
  }).required(),

  paymentMethod: Joi.string()
    .valid('ONLINE', 'COD', 'CARD', 'UPI')
    .required()
    .messages({
      'any.only': 'Payment method must be ONLINE, COD, CARD, or UPI',
      'any.required': 'Payment method is required',
    }),
  
  contactPhone: Joi.string().trim().allow('').optional(),
});

// Test cases
const testCases = [
  // Valid orders
  {
    name: 'Valid order - single item, COD',
    input: {
      items: [
        {
          menuItem: '507f1f77bcf86cd799439011',
          quantity: 2,
          price: 299.99,
        },
      ],
      deliveryAddress: {
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
      },
      paymentMethod: 'COD',
      contactPhone: '9876543210',
    },
    shouldPass: true,
  },
  {
    name: 'Valid order - multiple items, with apartment and landmark',
    input: {
      items: [
        {
          menuItem: '507f1f77bcf86cd799439011',
          quantity: 1,
          price: 199.99,
        },
        {
          menuItem: '507f1f77bcf86cd799439012',
          quantity: 3,
          price: 99.99,
          specialInstructions: 'Extra spicy please',
        },
      ],
      deliveryAddress: {
        street: '456 Park Avenue, Sector 12',
        apartment: 'Flat 501, Tower B',
        city: 'Bangalore',
        state: 'Karnataka',
        zipCode: '560001',
        landmark: 'Near City Mall',
      },
      paymentMethod: 'ONLINE',
      contactPhone: '9876543210',
    },
    shouldPass: true,
  },
  {
    name: 'Valid order - UPI payment',
    input: {
      items: [
        {
          menuItem: '507f1f77bcf86cd799439011',
          quantity: 1,
          price: 499.99,
        },
      ],
      deliveryAddress: {
        street: '789 Beach Road',
        city: 'Chennai',
        state: 'Tamil Nadu',
        zipCode: '600001',
      },
      paymentMethod: 'UPI',
    },
    shouldPass: true,
  },
  
  // Invalid items
  {
    name: 'Invalid - no items',
    input: {
      items: [],
      deliveryAddress: {
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
      },
      paymentMethod: 'COD',
    },
    shouldPass: false,
    expectedError: 'items',
  },
  {
    name: 'Invalid - invalid menuItem ID',
    input: {
      items: [
        {
          menuItem: 'invalid-id',
          quantity: 1,
          price: 299.99,
        },
      ],
      deliveryAddress: {
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
      },
      paymentMethod: 'COD',
    },
    shouldPass: false,
    expectedError: 'menuItem',
  },
  {
    name: 'Invalid - quantity zero',
    input: {
      items: [
        {
          menuItem: '507f1f77bcf86cd799439011',
          quantity: 0,
          price: 299.99,
        },
      ],
      deliveryAddress: {
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
      },
      paymentMethod: 'COD',
    },
    shouldPass: false,
    expectedError: 'quantity',
  },
  {
    name: 'Invalid - quantity exceeds 50',
    input: {
      items: [
        {
          menuItem: '507f1f77bcf86cd799439011',
          quantity: 51,
          price: 299.99,
        },
      ],
      deliveryAddress: {
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
      },
      paymentMethod: 'COD',
    },
    shouldPass: false,
    expectedError: 'quantity',
  },
  {
    name: 'Invalid - special instructions too long (201 chars)',
    input: {
      items: [
        {
          menuItem: '507f1f77bcf86cd799439011',
          quantity: 1,
          price: 299.99,
          specialInstructions: 'A'.repeat(201),
        },
      ],
      deliveryAddress: {
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
      },
      paymentMethod: 'COD',
    },
    shouldPass: false,
    expectedError: 'specialInstructions',
  },
  
  // Invalid address
  {
    name: 'Invalid - missing deliveryAddress',
    input: {
      items: [
        {
          menuItem: '507f1f77bcf86cd799439011',
          quantity: 1,
          price: 299.99,
        },
      ],
      paymentMethod: 'COD',
    },
    shouldPass: false,
    expectedError: 'deliveryAddress',
  },
  {
    name: 'Invalid - address with city containing numbers',
    input: {
      items: [
        {
          menuItem: '507f1f77bcf86cd799439011',
          quantity: 1,
          price: 299.99,
        },
      ],
      deliveryAddress: {
        street: '123 Main Street',
        city: 'Mumbai123',
        state: 'Maharashtra',
        zipCode: '400001',
      },
      paymentMethod: 'COD',
    },
    shouldPass: false,
    expectedError: 'city',
  },
  {
    name: 'Invalid - address with 5-digit zipCode',
    input: {
      items: [
        {
          menuItem: '507f1f77bcf86cd799439011',
          quantity: 1,
          price: 299.99,
        },
      ],
      deliveryAddress: {
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '40001',
      },
      paymentMethod: 'COD',
    },
    shouldPass: false,
    expectedError: 'zipCode',
  },
  {
    name: 'Invalid - address with short street (3 chars)',
    input: {
      items: [
        {
          menuItem: '507f1f77bcf86cd799439011',
          quantity: 1,
          price: 299.99,
        },
      ],
      deliveryAddress: {
        street: 'ABC',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
      },
      paymentMethod: 'COD',
    },
    shouldPass: false,
    expectedError: 'street',
  },
  
  // Invalid payment method
  {
    name: 'Invalid - invalid payment method',
    input: {
      items: [
        {
          menuItem: '507f1f77bcf86cd799439011',
          quantity: 1,
          price: 299.99,
        },
      ],
      deliveryAddress: {
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
      },
      paymentMethod: 'BITCOIN',
    },
    shouldPass: false,
    expectedError: 'paymentMethod',
  },
  {
    name: 'Invalid - missing payment method',
    input: {
      items: [
        {
          menuItem: '507f1f77bcf86cd799439011',
          quantity: 1,
          price: 299.99,
        },
      ],
      deliveryAddress: {
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
      },
    },
    shouldPass: false,
    expectedError: 'paymentMethod',
  },
  
  // Edge cases
  {
    name: 'Valid - exactly 50 quantity',
    input: {
      items: [
        {
          menuItem: '507f1f77bcf86cd799439011',
          quantity: 50,
          price: 299.99,
        },
      ],
      deliveryAddress: {
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
      },
      paymentMethod: 'COD',
    },
    shouldPass: true,
  },
  {
    name: 'Valid - special instructions exactly 200 chars',
    input: {
      items: [
        {
          menuItem: '507f1f77bcf86cd799439011',
          quantity: 1,
          price: 299.99,
          specialInstructions: 'A'.repeat(200),
        },
      ],
      deliveryAddress: {
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
      },
      paymentMethod: 'COD',
    },
    shouldPass: true,
  },
  {
    name: 'Valid - empty optional fields',
    input: {
      items: [
        {
          menuItem: '507f1f77bcf86cd799439011',
          quantity: 1,
        },
      ],
      deliveryAddress: {
        street: '123 Main Street',
        apartment: '',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        landmark: '',
      },
      paymentMethod: 'COD',
      contactPhone: '',
    },
    shouldPass: true,
  },
];

// Run tests
console.log('🧪 Starting Order Placement Validation Test Suite\n');
console.log('='.repeat(80));

let passed = 0;
let failed = 0;
const failures = [];

testCases.forEach((testCase, index) => {
  const { error } = orderSchema.validate(testCase.input, { abortEarly: false });
  const testPassed = testCase.shouldPass ? !error : !!error;
  
  if (testPassed) {
    passed++;
    console.log(`✅ Test ${index + 1}: ${testCase.name}`);
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}: ${testCase.name}`);
    if (error) {
      console.log(`   Error: ${error.details.map(d => d.message).join(', ')}`);
    } else {
      console.log(`   Expected validation to fail but it passed`);
    }
    failures.push({
      test: testCase.name,
      input: testCase.input,
      error: error ? error.details : 'No error',
    });
  }
});

console.log('='.repeat(80));
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests\n`);

if (failures.length > 0) {
  console.log('❌ Failed Tests:');
  failures.forEach((f, i) => {
    console.log(`\n${i + 1}. ${f.test}`);
    console.log(`   Input:`, JSON.stringify(f.input, null, 2));
    console.log(`   Error:`, JSON.stringify(f.error, null, 2));
  });
  process.exit(1);
} else {
  console.log('✅ All tests passed! Order validation is working correctly.\n');
  process.exit(0);
}
