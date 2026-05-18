import { z } from 'zod';

/**
 * Identificadores branded de entidades do domínio +Inclusão.
 *
 * Em runtime cada ID é apenas string (UUID v4). Os brands vivem no sistema
 * de tipos para evitar confusão entre tipos — passar `UserId` onde se
 * espera `CitizenId` é erro de compilação.
 *
 * Pattern: cada bounded context define seu brand. Adicionar aqui apenas
 * IDs **universais** (cross-context); IDs locais ficam no contexto.
 */

export const UserIdSchema = z.string().uuid().brand<'UserId'>();
export type UserId = z.infer<typeof UserIdSchema>;

export const ProgramIdSchema = z.string().uuid().brand<'ProgramId'>();
export type ProgramId = z.infer<typeof ProgramIdSchema>;

export const CitizenIdSchema = z.string().uuid().brand<'CitizenId'>();
export type CitizenId = z.infer<typeof CitizenIdSchema>;

export const ApplicationIdSchema = z.string().uuid().brand<'ApplicationId'>();
export type ApplicationId = z.infer<typeof ApplicationIdSchema>;
