/**
 * Secret Scanning
 * 
 * Detects potential secrets in environment variable values
 * to prevent accidental exposure of sensitive data
 */

export interface SecretPattern {
  name: string;
  description: string;
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Known secret patterns
 */
export const SECRET_PATTERNS: SecretPattern[] = [
  // AWS
  {
    name: 'AWS Access Key',
    description: 'AWS Access Key ID',
    pattern: /AKIA[0-9A-Z]{16}/i,
    severity: 'critical',
  },
  {
    name: 'AWS Secret Key',
    description: 'AWS Secret Access Key',
    pattern: /aws_secret_access_key[=:]\s*['"]?([A-Za-z0-9/+=]{40})['"]?/i,
    severity: 'critical',
  },

  // GitHub
  {
    name: 'GitHub Token',
    description: 'GitHub Personal Access Token',
    pattern: /ghp_[a-zA-Z0-9]{36}/,
    severity: 'critical',
  },
  {
    name: 'GitHub OAuth Token',
    description: 'GitHub OAuth Access Token',
    pattern: /gho_[a-zA-Z0-9]{36}/,
    severity: 'critical',
  },

  // Google
  {
    name: 'Google API Key',
    description: 'Google API Key',
    pattern: /AIza[0-9A-Za-z-_]{35}/,
    severity: 'critical',
  },
  {
    name: 'Google OAuth',
    description: 'Google OAuth Token',
    pattern: /ya29\.[0-9A-Za-z\-_]+/,
    severity: 'critical',
  },

  // Stripe
  {
    name: 'Stripe API Key',
    description: 'Stripe Secret Key',
    pattern: /sk_live_[0-9a-zA-Z]{24}/,
    severity: 'critical',
  },
  {
    name: 'Stripe Restricted Key',
    description: 'Stripe Restricted API Key',
    pattern: /rk_live_[0-9a-zA-Z]{24}/,
    severity: 'critical',
  },

  // Private Keys
  {
    name: 'RSA Private Key',
    description: 'RSA Private Key',
    pattern: /-----BEGIN RSA PRIVATE KEY-----/,
    severity: 'critical',
  },
  {
    name: 'SSH Private Key',
    description: 'SSH Private Key',
    pattern: /-----BEGIN OPENSSH PRIVATE KEY-----/,
    severity: 'critical',
  },
  {
    name: 'PGP Private Key',
    description: 'PGP Private Key Block',
    pattern: /-----BEGIN PGP PRIVATE KEY BLOCK-----/,
    severity: 'critical',
  },

  // Database URLs
  {
    name: 'PostgreSQL URL',
    description: 'PostgreSQL Connection String',
    pattern: /postgres:\/\/[^:]+:[^@]+@[^/]+\/\w+/i,
    severity: 'high',
  },
  {
    name: 'MySQL URL',
    description: 'MySQL Connection String',
    pattern: /mysql:\/\/[^:]+:[^@]+@[^/]+\/\w+/i,
    severity: 'high',
  },
  {
    name: 'MongoDB URL',
    description: 'MongoDB Connection String',
    pattern: /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/i,
    severity: 'high',
  },

  // API Keys (Generic)
  {
    name: 'Generic API Key',
    description: 'Generic API Key Pattern',
    pattern: /api[_-]?key[=:]\s*['"]?([a-zA-Z0-9]{32,})['"]?/i,
    severity: 'medium',
  },
  {
    name: 'Generic Secret',
    description: 'Generic Secret Pattern',
    pattern: /secret[=:]\s*['"]?([a-zA-Z0-9]{32,})['"]?/i,
    severity: 'medium',
  },

  // JWT Tokens
  {
    name: 'JWT Token',
    description: 'JSON Web Token',
    pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/,
    severity: 'high',
  },

  // Slack
  {
    name: 'Slack Token',
    description: 'Slack API Token',
    pattern: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,}/,
    severity: 'critical',
  },
  {
    name: 'Slack Webhook',
    description: 'Slack Webhook URL',
    pattern: /https:\/\/hooks\.slack\.com\/services\/[A-Z0-9]+\/[A-Z0-9]+\/[a-zA-Z0-9]+/,
    severity: 'high',
  },

  // SendGrid
  {
    name: 'SendGrid API Key',
    description: 'SendGrid API Key',
    pattern: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/,
    severity: 'critical',
  },

  // Twilio
  {
    name: 'Twilio API Key',
    description: 'Twilio API Key',
    pattern: /SK[a-z0-9]{32}/,
    severity: 'critical',
  },

  // Heroku
  {
    name: 'Heroku API Key',
    description: 'Heroku API Key',
    pattern: /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/,
    severity: 'high',
  },
];

export interface ScanResult {
  detected: boolean;
  matches: Array<{
    pattern: SecretPattern;
    value: string;
    position: number;
  }>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Scan a value for potential secrets
 */
export function scanForSecrets(value: string): ScanResult {
  const matches: ScanResult['matches'] = [];
  let highestSeverity: ScanResult['severity'] = 'low';

  for (const pattern of SECRET_PATTERNS) {
    const match = value.match(pattern.pattern);
    
    if (match) {
      const matchedValue = match[0];
      const position = match.index || 0;
      
      matches.push({
        pattern,
        value: maskSecret(matchedValue),
        position,
      });

      // Update highest severity
      const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
      if (severityLevels[pattern.severity] > severityLevels[highestSeverity]) {
        highestSeverity = pattern.severity;
      }
    }
  }

  return {
    detected: matches.length > 0,
    matches,
    severity: highestSeverity,
  };
}

/**
 * Mask secret value for display
 */
function maskSecret(value: string): string {
  if (value.length <= 8) {
    return '••••••••';
  }
  
  const start = value.slice(0, 4);
  const end = value.slice(-4);
  const middle = '•'.repeat(Math.min(value.length - 8, 20));
  
  return `${start}${middle}${end}`;
}

/**
 * Get recommendations for detected secrets
 */
export function getSecretRecommendations(scanResult: ScanResult): string[] {
  if (!scanResult.detected) {
    return [];
  }

  const recommendations: string[] = [];

  if (scanResult.severity === 'critical' || scanResult.severity === 'high') {
    recommendations.push(
      '⚠️ Critical: This appears to contain a secret or API key.',
      '🔒 Recommendation: Use environment-specific variables instead of hardcoding secrets.',
      '📝 Consider using secret references or a key vault service.'
    );
  }

  scanResult.matches.forEach(match => {
    if (match.pattern.name.includes('Private Key')) {
      recommendations.push(
        `🔑 Detected: ${match.pattern.name}`,
        '   Never store private keys in plain text.',
        '   Use certificate management services or mounted secrets.'
      );
    } else if (match.pattern.name.includes('Database')) {
      recommendations.push(
        `🗄️  Detected: ${match.pattern.name}`,
        '   Database URLs should be environment-specific.',
        '   Ensure passwords are strong and rotated regularly.'
      );
    } else {
      recommendations.push(
        `🔍 Detected: ${match.pattern.name}`,
        `   ${match.pattern.description}`
      );
    }
  });

  return recommendations;
}

/**
 * Check if a key name suggests it should contain a secret
 */
export function isSecretKey(key: string): boolean {
  const secretKeywords = [
    'key',
    'secret',
    'token',
    'password',
    'pass',
    'pwd',
    'api',
    'auth',
    'credential',
    'private',
  ];

  const lowerKey = key.toLowerCase();
  return secretKeywords.some(keyword => lowerKey.includes(keyword));
}
