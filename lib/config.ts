const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

if (JWT_SECRET === 'your-super-secret-jwt-key-change-in-production' || JWT_SECRET === 'your-secret-key') {
  throw new Error('JWT_SECRET must be set to a secure value, not the placeholder default');
}

if (JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters for adequate entropy');
}

export const ENABLE_LEGACY_JWT = process.env.ENABLE_LEGACY_JWT === 'true';

const encoder = new TextEncoder();

export const jwtSecretString = JWT_SECRET;
export const jwtSecretBuffer = encoder.encode(JWT_SECRET);
