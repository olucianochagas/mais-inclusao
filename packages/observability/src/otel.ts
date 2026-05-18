import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { NodeSDK } from '@opentelemetry/sdk-node';

export interface OpenTelemetryEnvironmentInput {
  readonly serviceName: string;
  readonly serviceVersion?: string;
  readonly environment?: string;
  readonly resourceAttributes?: Readonly<Record<string, string>>;
}

export interface OpenTelemetryBootstrapInput extends OpenTelemetryEnvironmentInput {
  readonly enableAutoInstrumentations?: boolean;
}

export interface BuiltOpenTelemetryEnvironment {
  readonly OTEL_SERVICE_NAME: string;
  readonly OTEL_RESOURCE_ATTRIBUTES?: string;
}

const buildResourceAttributes = (input: OpenTelemetryEnvironmentInput): string | undefined => {
  const attributes: Record<string, string> = {
    'service.name': input.serviceName,
  };

  if (input.serviceVersion !== undefined) {
    attributes['service.version'] = input.serviceVersion;
  }

  if (input.environment !== undefined) {
    attributes['deployment.environment'] = input.environment;
  }

  if (input.resourceAttributes !== undefined) {
    Object.assign(attributes, input.resourceAttributes);
  }

  const serializedAttributes = Object.entries(attributes)
    .map(([key, value]) => `${key}=${value}`)
    .join(',');

  return serializedAttributes.length === 0 ? undefined : serializedAttributes;
};

export const buildOpenTelemetryEnvironment = (
  input: OpenTelemetryEnvironmentInput,
): BuiltOpenTelemetryEnvironment => ({
  OTEL_SERVICE_NAME: input.serviceName,
  ...(buildResourceAttributes(input) === undefined
    ? {}
    : { OTEL_RESOURCE_ATTRIBUTES: buildResourceAttributes(input) }),
});

const applyEnvironmentIfMissing = (environment: BuiltOpenTelemetryEnvironment): void => {
  process.env.OTEL_SERVICE_NAME ??= environment.OTEL_SERVICE_NAME;

  if (environment.OTEL_RESOURCE_ATTRIBUTES !== undefined) {
    process.env.OTEL_RESOURCE_ATTRIBUTES ??= environment.OTEL_RESOURCE_ATTRIBUTES;
  }
};

export const bootstrapOpenTelemetry = (input: OpenTelemetryBootstrapInput): NodeSDK => {
  applyEnvironmentIfMissing(buildOpenTelemetryEnvironment(input));

  return new NodeSDK({
    instrumentations:
      input.enableAutoInstrumentations === false ? [] : [getNodeAutoInstrumentations()],
  });
};

export const shutdownOpenTelemetry = async (sdk: NodeSDK): Promise<void> => {
  await Promise.resolve(sdk.shutdown());
};
