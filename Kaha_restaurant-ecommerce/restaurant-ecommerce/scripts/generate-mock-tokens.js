#!/usr/bin/env node
/**
 * Generate Mock JWT Tokens for Testing
 * Creates valid JWT tokens that will pass authentication
 */

const jwt = require('jsonwebtoken');

// JWT Secret from .env
const JWT_SECRET = 'secret';

// Mock User Data
const mockUsers = {
  regularUser: {
    id: 'user-mock-001',
    kahaId: 'kaha-mock-001',
    businessId: 'biz-mock-001',
    email: 'user@test.com',
    role: 'USER'
  },
  adminUser: {
    id: 'admin-mock-001',
    kahaId: 'kaha-admin-001',
    businessId: 'biz-mock-001',
    email: 'admin@test.com',
    role: 'BUSINESS_SUPER_ADMIN'
  },
  businessOwner: {
    id: 'owner-mock-001',
    kahaId: 'kaha-owner-001',
    businessId: 'biz-mock-001',
    email: 'owner@test.com',
    role: 'BUSINESS_OWNER'
  }
};

console.log('=' .repeat(80));
console.log('MOCK JWT TOKENS FOR POSTMAN');
console.log('=' .repeat(80));
console.log();

// Generate tokens
Object.entries(mockUsers).forEach(([key, userData]) => {
  const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '30d' });
  
  console.log(`${key.toUpperCase()}:`);
  console.log(`User ID: ${userData.id}`);
  console.log(`Role: ${userData.role}`);
  console.log(`Token:`);
  console.log(token);
  console.log();
});

console.log('=' .repeat(80));
console.log('HOW TO USE IN POSTMAN');
console.log('=' .repeat(80));
console.log();
console.log('1. Copy the token for the user type you need');
console.log('2. In Postman, set the variable:');
console.log('   - authToken = regularUser token (for normal operations)');
console.log('   - adminToken = adminUser token (for admin operations)');
console.log('3. These tokens are valid for 30 days');
console.log();
console.log('=' .repeat(80));
console.log('POSTMAN VARIABLES');
console.log('=' .repeat(80));
console.log();
console.log('userId: user-mock-001');
console.log('businessId: biz-mock-001');
console.log('authToken: (copy regularUser token above)');
console.log('adminToken: (copy adminUser token above)');
console.log();
