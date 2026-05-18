const SUBJECT_NAMESPACE = 'mais-inclusao' as const;
const SUBJECT_CHANNEL = 'events' as const;
const EVENT_TYPE_PATTERN = /^[a-z_]+\.[a-z_]+\.[a-z_]+$/;
const ENVIRONMENT_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;

export function parseEventType(eventType: string): {
  context: string;
  entity: string;
  event: string;
} {
  const normalized = eventType.trim();

  if (!EVENT_TYPE_PATTERN.test(normalized)) {
    throw new Error('event_type deve seguir o formato <context>.<entity>.<event> em snake_case');
  }

  const [context, entity, event] = normalized.split('.') as [string, string, string];

  return {
    context,
    entity,
    event,
  };
}

export function normalizeEnvironment(environment: string): string {
  const normalized = environment.trim().toLowerCase();

  if (!ENVIRONMENT_PATTERN.test(normalized)) {
    throw new Error('environment deve conter apenas letras, números, hífen e underscore');
  }

  return normalized;
}

export function buildEventSubject(environment: string, eventType: string): string {
  const { context } = parseEventType(eventType);
  const env = normalizeEnvironment(environment);

  return `${SUBJECT_NAMESPACE}.${env}.${SUBJECT_CHANNEL}.${context}`;
}

export function getSubjectNamespace(): string {
  return SUBJECT_NAMESPACE;
}
