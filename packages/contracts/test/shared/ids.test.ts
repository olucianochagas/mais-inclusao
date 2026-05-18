import { describe, expect, expectTypeOf, it } from 'vitest';
import { zodToJsonSchema } from 'zod-to-json-schema';

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
    expectTypeOf(userId).not.toExtend<ProgramId>();
    expectTypeOf(programId).not.toExtend<UserId>();
  });

  it('CitizenId é distinto de ApplicationId', () => {
    const citizenId = CitizenIdSchema.parse(validUuid);
    const applicationId = ApplicationIdSchema.parse(validUuid);
    expectTypeOf(citizenId).not.toExtend<ApplicationId>();
    expectTypeOf(applicationId).not.toExtend<CitizenId>();
  });
});

describe('ID schemas JSON Schema snapshots', () => {
  it('UserIdSchema', () => {
    expect(zodToJsonSchema(UserIdSchema, { name: 'UserId' })).toMatchSnapshot();
  });

  it('ProgramIdSchema', () => {
    expect(zodToJsonSchema(ProgramIdSchema, { name: 'ProgramId' })).toMatchSnapshot();
  });

  it('CitizenIdSchema', () => {
    expect(zodToJsonSchema(CitizenIdSchema, { name: 'CitizenId' })).toMatchSnapshot();
  });

  it('ApplicationIdSchema', () => {
    expect(zodToJsonSchema(ApplicationIdSchema, { name: 'ApplicationId' })).toMatchSnapshot();
  });
});
