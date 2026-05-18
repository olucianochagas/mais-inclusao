import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  type ProblemDetails,
  ProblemDetailsSchema,
} from '../../src/shared/error.js';

describe('ProblemDetailsSchema', () => {
  const minimal = { title: 'Bad Request', status: 400 };

  it('aceita problem details mínimo', () => {
    const parsed = ProblemDetailsSchema.parse(minimal);
    expect(parsed.type).toBe('about:blank');
    expect(parsed.title).toBe('Bad Request');
    expect(parsed.status).toBe(400);
  });

  it('aceita type customizado URL', () => {
    const data = { ...minimal, type: 'https://mais-inclusao.org/errors/x' };
    expect(() => ProblemDetailsSchema.parse(data)).not.toThrow();
  });

  it('rejeita type não-URL', () => {
    expect(() =>
      ProblemDetailsSchema.parse({ ...minimal, type: 'not-a-url' }),
    ).toThrow();
  });

  it('rejeita status < 100', () => {
    expect(() =>
      ProblemDetailsSchema.parse({ ...minimal, status: 99 }),
    ).toThrow();
  });

  it('rejeita status > 599', () => {
    expect(() =>
      ProblemDetailsSchema.parse({ ...minimal, status: 600 }),
    ).toThrow();
  });

  it('rejeita status não-inteiro', () => {
    expect(() =>
      ProblemDetailsSchema.parse({ ...minimal, status: 400.5 }),
    ).toThrow();
  });

  it('aceita correlation_id UUID', () => {
    expect(() =>
      ProblemDetailsSchema.parse({
        ...minimal,
        correlation_id: '550e8400-e29b-41d4-a716-446655440000',
      }),
    ).not.toThrow();
  });

  it('rejeita correlation_id não-UUID', () => {
    expect(() =>
      ProblemDetailsSchema.parse({ ...minimal, correlation_id: 'not-uuid' }),
    ).toThrow();
  });

  it('aceita extension errors[]', () => {
    expect(() =>
      ProblemDetailsSchema.parse({
        ...minimal,
        errors: [
          { path: 'body.email', code: 'invalid_email', message: 'Invalid' },
          { path: 'body.password', code: 'too_short', message: 'Too short' },
        ],
      }),
    ).not.toThrow();
  });

  it('rejeita errors[] com item incompleto', () => {
    expect(() =>
      ProblemDetailsSchema.parse({
        ...minimal,
        errors: [{ path: 'body.email' }],
      }),
    ).toThrow();
  });

  it('aceita detail e instance opcionais', () => {
    const parsed = ProblemDetailsSchema.parse({
      ...minimal,
      detail: 'Email already in use',
      instance: 'https://api.example.com/requests/abc123',
    });
    expect(parsed.detail).toBe('Email already in use');
    expect(parsed.instance).toBe('https://api.example.com/requests/abc123');
  });

  it('infere ProblemDetails corretamente', () => {
    const parsed = ProblemDetailsSchema.parse(minimal);
    expectTypeOf(parsed).toMatchTypeOf<ProblemDetails>();
  });
});
