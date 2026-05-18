import pino, {
  type Bindings,
  type DestinationStream,
  type Logger,
  type LoggerOptions,
} from 'pino';

export interface LogContext extends Bindings {
  readonly correlation_id?: string;
  readonly tenant_id?: string;
  readonly user_id?: string;
  readonly request_id?: string;
}

export interface BuildLoggerOptionsInput {
  readonly serviceName: string;
  readonly environment?: string;
  readonly level?: LoggerOptions['level'];
  readonly bindings?: Bindings;
  readonly redactPaths?: readonly string[];
}

export const DEFAULT_REDACT_PATHS = [
  'password',
  '*.password',
  'token',
  '*.token',
  'secret',
  '*.secret',
  'email',
  '*.email',
  'cpf',
  '*.cpf',
  'phone',
  '*.phone',
  'credit_card',
  '*.credit_card',
  'authorization',
  'headers.authorization',
  'cookie',
  'cookies',
] as const;

const uniquePaths = (paths: readonly string[]): string[] => [...new Set(paths)];

export const buildLoggerOptions = (
  input: BuildLoggerOptionsInput,
): LoggerOptions => {
  const redactPaths = uniquePaths([
    ...DEFAULT_REDACT_PATHS,
    ...(input.redactPaths ?? []),
  ]);

  const base: Bindings = {
    service_name: input.serviceName,
  };

  if (input.environment !== undefined) {
    base.environment = input.environment;
  }

  if (input.bindings !== undefined) {
    Object.assign(base, input.bindings);
  }

  return {
    base,
    level: input.level ?? 'info',
    redact: {
      paths: redactPaths,
      remove: false,
    },
  };
};

export const createLogger = (
  input: BuildLoggerOptionsInput,
  destination?: DestinationStream,
): Logger => pino(buildLoggerOptions(input), destination);

export const withLogContext = (logger: Logger, context: LogContext): Logger =>
  logger.child(context);
