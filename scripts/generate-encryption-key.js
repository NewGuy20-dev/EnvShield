#!/usr/bin/env node
const crypto = require('crypto');

try {
  console.log(crypto.randomBytes(32).toString('hex'));
} catch (error) {
  console.error('Failed to generate encryption key:', error);
  process.exit(1);
}
