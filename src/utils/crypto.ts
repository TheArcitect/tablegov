// ============================================================
// Cryptographic utilities for audit trail and sortition
// ============================================================

export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function getCryptoSeed(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Deterministic Fisher-Yates shuffle using a seeded PRNG.
 * Seed is derived from the cryptographic seed string.
 */
export function seededShuffle<T>(array: T[], seedHex: string): T[] {
  const result = [...array];
  // Simple seeded PRNG (xorshift32) from seed bytes
  let state = 0;
  for (let i = 0; i < Math.min(seedHex.length, 8); i++) {
    state = (state << 4) | parseInt(seedHex[i], 16);
  }
  if (state === 0) state = 1;

  function nextRandom(): number {
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  }

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
