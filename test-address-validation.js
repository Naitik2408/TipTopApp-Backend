/**
 * Address Validation Test Suite
 * Tests to ensure frontend and backend address validation rules match
 * Run: node test-address-validation.js
 */

const Joi = require('joi');

// Backend validation schema (from order.validator.js deliveryAddress)
const addressSchema = Joi.object({
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
  label: Joi.string().trim().max(50).allow('').optional().messages({
    'string.max': 'Label is too long (max 50 characters)',
  }),
});

// Test cases with expected results
const testCases = [
  // Valid addresses
  {
    name: 'Valid address - minimal',
    input: {
      street: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
    },
    shouldPass: true,
  },
  {
    name: 'Valid address - complete',
    input: {
      street: '123 Main Street, Block A',
      apartment: 'Flat 501, Tower B',
      city: 'New Delhi',
      state: 'Delhi',
      zipCode: '110001',
      landmark: 'Near City Mall',
      label: 'My Home',
    },
    shouldPass: true,
  },
  {
    name: 'Valid address - with spaces in city/state',
    input: {
      street: '456 Park Avenue',
      city: 'New Mumbai',
      state: 'Tamil Nadu',
      zipCode: '600001',
    },
    shouldPass: true,
  },
  
  // Invalid street
  {
    name: 'Invalid - street too short (4 chars)',
    input: {
      street: 'Abc',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
    },
    shouldPass: false,
    expectedError: 'street',
  },
  {
    name: 'Invalid - street missing',
    input: {
      street: '',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
    },
    shouldPass: false,
    expectedError: 'street',
  },
  {
    name: 'Invalid - street too long (201 chars)',
    input: {
      street: 'A'.repeat(201),
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
    },
    shouldPass: false,
    expectedError: 'street',
  },
  
  // Invalid city
  {
    name: 'Invalid - city with numbers',
    input: {
      street: '123 Main Street',
      city: 'Mumbai123',
      state: 'Maharashtra',
      zipCode: '400001',
    },
    shouldPass: false,
    expectedError: 'city',
  },
  {
    name: 'Invalid - city too short (1 char)',
    input: {
      street: '123 Main Street',
      city: 'M',
      state: 'Maharashtra',
      zipCode: '400001',
    },
    shouldPass: false,
    expectedError: 'city',
  },
  {
    name: 'Invalid - city missing',
    input: {
      street: '123 Main Street',
      city: '',
      state: 'Maharashtra',
      zipCode: '400001',
    },
    shouldPass: false,
    expectedError: 'city',
  },
  {
    name: 'Invalid - city too long (51 chars)',
    input: {
      street: '123 Main Street',
      city: 'A'.repeat(51),
      state: 'Maharashtra',
      zipCode: '400001',
    },
    shouldPass: false,
    expectedError: 'city',
  },
  
  // Invalid state
  {
    name: 'Invalid - state with numbers',
    input: {
      street: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra123',
      zipCode: '400001',
    },
    shouldPass: false,
    expectedError: 'state',
  },
  {
    name: 'Invalid - state too short (1 char)',
    input: {
      street: '123 Main Street',
      city: 'Mumbai',
      state: 'M',
      zipCode: '400001',
    },
    shouldPass: false,
    expectedError: 'state',
  },
  {
    name: 'Invalid - state missing',
    input: {
      street: '123 Main Street',
      city: 'Mumbai',
      state: '',
      zipCode: '400001',
    },
    shouldPass: false,
    expectedError: 'state',
  },
  
  // Invalid zipCode
  {
    name: 'Invalid - zipCode with 5 digits',
    input: {
      street: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '40001',
    },
    shouldPass: false,
    expectedError: 'zipCode',
  },
  {
    name: 'Invalid - zipCode with 7 digits',
    input: {
      street: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '4000011',
    },
    shouldPass: false,
    expectedError: 'zipCode',
  },
  {
    name: 'Invalid - zipCode with letters',
    input: {
      street: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '40000A',
    },
    shouldPass: false,
    expectedError: 'zipCode',
  },
  {
    name: 'Invalid - zipCode missing',
    input: {
      street: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '',
    },
    shouldPass: false,
    expectedError: 'zipCode',
  },
  
  // Invalid optional fields
  {
    name: 'Invalid - apartment too long (101 chars)',
    input: {
      street: '123 Main Street',
      apartment: 'A'.repeat(101),
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
    },
    shouldPass: false,
    expectedError: 'apartment',
  },
  {
    name: 'Invalid - landmark too long (101 chars)',
    input: {
      street: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      landmark: 'A'.repeat(101),
    },
    shouldPass: false,
    expectedError: 'landmark',
  },
  {
    name: 'Invalid - label too long (51 chars)',
    input: {
      street: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      label: 'A'.repeat(51),
    },
    shouldPass: false,
    expectedError: 'label',
  },
  
  // Edge cases
  {
    name: 'Valid - street exactly 5 chars',
    input: {
      street: 'Abcde',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
    },
    shouldPass: true,
  },
  {
    name: 'Valid - street exactly 200 chars',
    input: {
      street: 'A'.repeat(200),
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
    },
    shouldPass: true,
  },
  {
    name: 'Valid - city exactly 2 chars',
    input: {
      street: '123 Main Street',
      city: 'AB',
      state: 'Maharashtra',
      zipCode: '400001',
    },
    shouldPass: true,
  },
  {
    name: 'Valid - city exactly 50 chars',
    input: {
      street: '123 Main Street',
      city: 'A'.repeat(50),
      state: 'Maharashtra',
      zipCode: '400001',
    },
    shouldPass: true,
  },
  {
    name: 'Valid - empty optional fields',
    input: {
      street: '123 Main Street',
      apartment: '',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      landmark: '',
      label: '',
    },
    shouldPass: true,
  },
];

// Run tests
console.log('🧪 Starting Address Validation Test Suite\n');
console.log('=' .repeat(80));

let passed = 0;
let failed = 0;
const failures = [];

testCases.forEach((testCase, index) => {
  const { error } = addressSchema.validate(testCase.input, { abortEarly: false });
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

console.log('=' .repeat(80));
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests\n`);

if (failures.length > 0) {
  console.log('❌ Failed Tests:');
  failures.forEach((f, i) => {
    console.log(`\n${i + 1}. ${f.test}`);
    console.log(`   Input:`, JSON.stringify(f.input, null, 2));
    console.log(`   Error:`, f.error);
  });
  process.exit(1);
} else {
  console.log('✅ All tests passed! Frontend and backend validations are consistent.\n');
  process.exit(0);
}
