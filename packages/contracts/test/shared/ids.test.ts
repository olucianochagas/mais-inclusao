import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  type ApplicationId,
  ApplicationIdSchema,
  type CitizenId,
  CitizenIdSchema,
  type ProgramId,
  ProgramIdSchema,
  type UserId,
  UserIdSchema,
} from '../../src/shared/ids.js';

const validUuid = '550e8400-e29b-41d4-a716-446655440000';

describe.each([
  ['UserIdSchema', UserIdSchema],
  ['ProgramIdSchema', ProgramIdSchema],
  ['CitizenIdSchema', CitizenIdSchema],
  ['ApplicationIdSchema', ApplicationIdSchema],
] as const)('%s', (_name, schema) => {
  it('aceita UUID válido', () => {
    expect(() => schema.parse(validUuid)).not.toThrow();
  });

  it('rejeita UUID malformado', () => {
    expect(() => schema.parse('xxx')).toThrow();
  });

  it('rejeita não-string', () => {
    expect(() => schema.parse(42)).toThrow();
    expect(() => schema.parse(null)).toThrow();
    expect(() => schema.parse(undefined)).toThrow();
  });
});

describe('Brand types', () => {
  it('UserId é distinto de ProgramId no sistema de tipos', () => {
    const userId = UserIdSchema.parse(validUuid);
    const programId = ProgramIdSchema.parse(validUuid);
    expectTypeOf(userId).not.toMatchTypeOf<ProgramId>();
    expectTypeOf(programId).not.toMatchTypeOf<UserId>();
  });

  it('CitizenId é distinto de ApplicationId', () => {
    const citizenId = CitizenIdSchema.parse(validUuid);
    const applicationId = ApplicationIdSchema.parse(validUuid);
    expectTypeOf(citizenId).not.toMatchTypeOf<ApplicationId>();
    expectTypeOf(applicationId).not.toMatchTypeOf<CitizenId>();
  });
});
