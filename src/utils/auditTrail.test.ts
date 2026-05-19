import { describe, it, expect } from 'vitest';
import { createAuditEntry } from '../store/useStore';
import type { AuditEntry } from '../types';

// Mirrors verifyChain from src/components/AuditTrail.tsx — checks that
// each entry's previousHash matches the prior entry's hash.
function verifyChain(log: { hash: string; previousHash: string }[]): boolean {
  if (log.length <= 1) return true;
  for (let i = 1; i < log.length; i++) {
    if (log[i].previousHash !== log[i - 1].hash) return false;
  }
  return true;
}

function firstBrokenIndex(log: { hash: string; previousHash: string }[]): number {
  for (let i = 1; i < log.length; i++) {
    if (log[i].previousHash !== log[i - 1].hash) return i;
  }
  return -1;
}

async function buildChain(length: number): Promise<AuditEntry[]> {
  const entries: AuditEntry[] = [];
  let previousHash = '';
  for (let i = 0; i < length; i++) {
    const entry = await createAuditEntry(
      'charter_created',
      'charter',
      `entity-${i}`,
      `Entry number ${i}`,
      previousHash
    );
    entries.push(entry);
    previousHash = entry.hash;
  }
  return entries;
}

describe('audit trail: hash chain integrity', () => {
  it('builds a 5-entry chain where each entry incorporates the prior entry\'s hash', async () => {
    const chain = await buildChain(5);

    expect(chain).toHaveLength(5);
    expect(chain[0].previousHash).toBe('');

    for (let i = 1; i < chain.length; i++) {
      expect(chain[i].previousHash).toBe(chain[i - 1].hash);
    }

    expect(verifyChain(chain)).toBe(true);
  });
});

describe('audit trail: tamper detection', () => {
  it('flags the chain as broken when entry #3 is modified', async () => {
    const chain = await buildChain(5);
    expect(verifyChain(chain)).toBe(true);

    // Tamper entry #3 (index 2) by altering its hash — simulates content
    // being changed and the entry re-hashed.
    const tampered = chain.map((e, i) =>
      i === 2 ? { ...e, hash: '0'.repeat(64) } : e
    );

    expect(verifyChain(tampered)).toBe(false);

    // The break is at entry #4 (index 3): its previousHash still points
    // at the ORIGINAL entry #3 hash, which no longer matches the tampered one.
    expect(firstBrokenIndex(tampered)).toBe(3);
  });
});
