import { execa, type Options } from 'execa';

/**
 * Wrappers idiomáticos de `execa` para integration tests.
 * NUNCA usar `execSync` em tests — args sempre array, sem string
 * concatenation, sem superfície de shell injection.
 *
 * Return type explícito `Promise<void>` para evitar TS2742 quando o
 * tipo inferido cita paths internos de `execa/types/*`.
 */
export const runPnpm = async (args: readonly string[], opts: Options = {}): Promise<void> => {
  await execa('pnpm', [...args], { stdio: 'inherit', ...opts });
};

export const runPrismaMigrateDeploy = (): Promise<void> =>
  runPnpm(['--filter', '@mais-inclusao/tenancy-service', 'db:migrate', 'deploy']);

export const runPrismaSeed = (): Promise<void> =>
  runPnpm(['--filter', '@mais-inclusao/tenancy-service', 'db:seed']);
