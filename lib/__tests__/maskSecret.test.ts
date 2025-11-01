import { maskSecret } from '@/lib/secrets';

describe('maskSecret', () => {
  it('returns bullets for very short secrets', () => {
    expect(maskSecret('abc')).toBe('••••');
  });

  it('masks middle characters while preserving edges', () => {
    const result = maskSecret('supersecretvalue');
    expect(result.startsWith('su')).toBe(true);
    expect(result.endsWith('ue')).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(6);
    expect(result.includes('•')).toBe(true);
  });

  it('pads mask to at least four dots', () => {
    const result = maskSecret('abcd');
    expect(result).toBe('••••');
  });
});
