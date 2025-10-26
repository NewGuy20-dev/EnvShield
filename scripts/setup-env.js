const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envLocalPath = path.join(__dirname, '..', '.env.local');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(envLocalPath)) {
  fs.copyFileSync(envExamplePath, envLocalPath);
  console.log('Created .env.local from .env.example');
}

let envContent = fs.readFileSync(envLocalPath, 'utf-8');

if (envContent.includes('ENCRYPTION_KEY=""')) {
  const newKey = crypto.randomBytes(32).toString('hex');
  envContent = envContent.replace('ENCRYPTION_KEY=""', `ENCRYPTION_KEY="${newKey}"`);
  fs.writeFileSync(envLocalPath, envContent);
  console.log('Generated and set new ENCRYPTION_KEY in .env.local');
} else {
  console.log('ENCRYPTION_KEY already set in .env.local, skipping generation.');
}
