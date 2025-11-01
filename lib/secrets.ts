export function maskSecret(secret: string) {
  if (secret.length <= 4) {
    return '••••';
  }

  const visible = Math.min(2, secret.length - 2);
  const start = secret.slice(0, visible);
  const end = secret.slice(-visible);
  const maskLength = Math.max(4, secret.length - visible * 2);
  return `${start}${'•'.repeat(maskLength)}${end}`;
}
