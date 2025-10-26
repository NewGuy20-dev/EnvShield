#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envLocalPath = path.join(__dirname, '..', '.env.local');
const envExamplePath = path.join(__dirname, '..', '.env.example');

try {
  if (!fs.existsSync(envExamplePath)) {
    console.error('Error: .env.example file not found. Please ensure it exists in the project root.');
    process.exit(1);
  }

  if (!fs.existsSync(envLocalPath)) {
    try {
      fs.copyFileSync(envExamplePath, envLocalPath);
      console.log('Created .env.local from .env.example');
    } catch (error) {
      console.error('Failed to create .env.local:', error);
      process.exit(1);
    }
  }

  let envContent;
  try {
    envContent = fs.readFileSync(envLocalPath, 'utf-8');
  } catch (error) {
    console.error('Failed to read .env.local:', error);
    process.exit(1);
  }

  const keyRegex = /^ENCRYPTION_KEY\s*=\s*["']?["']?\s*$/m;
  if (keyRegex.test(envContent)) {
    let newKey;
    try {
      newKey = crypto.randomBytes(32).toString('hex');
    } catch (error) {
      console.error('Failed to generate encryption key:', error);
      process.exit(1);
    }
    const updatedContent = envContent.replace(keyRegex, `ENCRYPTION_KEY="${newKey}"`);
    try {
      fs.writeFileSync(envLocalPath, updatedContent);
      console.log('Generated and set new ENCRYPTION_KEY in .env.local');
    } catch (error) {
      console.error('Failed to write ENCRYPTION_KEY to .env.local:', error);
      process.exit(1);
    }
  } else {
    console.log('ENCRYPTION_KEY already set in .env.local, skipping generation.');
  }
} catch (error) {
  console.error('An unexpected error occurred:', error);
  process.exit(1);
}
