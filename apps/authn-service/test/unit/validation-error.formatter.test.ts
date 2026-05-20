import type { ValidationError } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { flattenValidationErrors } from '../../src/shared/validation-error.formatter.js';

describe('flattenValidationErrors', () => {
  it('vazio retorna array vazio', () => {
    expect(flattenValidationErrors([])).toEqual([]);
  });

  it('um erro top-level com um constraint', () => {
    const errors: ValidationError[] = [
      {
        property: 'email',
        constraints: { isEmail: 'email must be an email' },
      },
    ];
    expect(flattenValidationErrors(errors)).toEqual([
      { constraint: 'isEmail', message: 'email must be an email', path: 'email' },
    ]);
  });

  it('um erro com múltiplos constraints emite um item por constraint', () => {
    const errors: ValidationError[] = [
      {
        property: 'password',
        constraints: {
          minLength: 'password must be at least 12 chars',
          isString: 'password must be a string',
        },
      },
    ];
    const flat = flattenValidationErrors(errors);
    expect(flat).toHaveLength(2);
    expect(flat.map((e) => e.constraint).sort()).toEqual(['isString', 'minLength']);
    expect(flat.every((e) => e.path === 'password')).toBe(true);
  });

  it('aninhamento: address.postalCode', () => {
    const errors: ValidationError[] = [
      {
        property: 'address',
        children: [
          {
            property: 'postalCode',
            constraints: { length: 'postalCode must be 2-10 chars' },
          },
        ],
      },
    ];
    expect(flattenValidationErrors(errors)).toEqual([
      { constraint: 'length', message: 'postalCode must be 2-10 chars', path: 'address.postalCode' },
    ]);
  });

  it('mistura: top-level + aninhado profundo (arrays incluem índice)', () => {
    const errors: ValidationError[] = [
      { property: 'email', constraints: { isEmail: 'invalid' } },
      {
        property: 'metadata',
        children: [
          {
            property: 'tags',
            children: [
              {
                property: '0',
                constraints: { isString: 'tag[0] must be string' },
              },
            ],
          },
        ],
      },
    ];
    const flat = flattenValidationErrors(errors);
    expect(flat).toHaveLength(2);
    expect(flat.map((e) => e.path).sort()).toEqual(['email', 'metadata.tags.0']);
  });
});
