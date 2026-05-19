import { describe, expect, it } from 'vitest';

import { hmacSha256 } from '../src/hmac.js';

describe('hmacSha256', () => {
  const pepper = Buffer.alloc(32, 'p');

  it('retorna 64 chars hex (HMAC-SHA256 = 32 bytes)', () => {
    const hash = hmacSha256('test@example.com', pepper);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('é determinístico: mesmo input → mesmo output', () => {
    expect(hmacSha256('a@b.c', pepper)).toBe(hmacSha256('a@b.c', pepper));
  });

  it('inputs diferentes geram outputs diferentes', () => {
    expect(hmacSha256('a@b.c', pepper)).not.toBe(hmacSha256('A@B.C', pepper));
  });

  it('peppers diferentes geram outputs diferentes (segurança)', () => {
    const pepper2 = Buffer.alloc(32, 'q');
    expect(hmacSha256('same@input.com', pepper)).not.toBe(
      hmacSha256('same@input.com', pepper2),
    );
  });

  it('pepper vazio funciona mas é inseguro (não bloqueia, mas docs avisam)', () => {
    const empty = Buffer.alloc(0);
    expect(() => hmacSha256('x', empty)).not.toThrow();
  });
});
