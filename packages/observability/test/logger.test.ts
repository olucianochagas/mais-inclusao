import { describe, expect, it } from 'vitest';

import { buildLoggerOptions, createLogger, withLogContext } from '../src/logger.js';

describe('logger helpers', () => {
    it('builds logger options with safe redaction defaults', () => {
        const options = buildLoggerOptions({
            serviceName: 'auth-service',
            environment: 'dev',
        });

        expect(options.base).toMatchObject({
            service_name: 'auth-service',
            environment: 'dev',
        });
        expect(options.redact).toMatchObject({ remove: false });

        const redact = options.redact;
        const redactPaths = Array.isArray(redact) ? redact : redact?.paths ?? [];

        expect(redactPaths).toContain('password');
        expect(redactPaths).toContain('headers.authorization');
        expect(redactPaths).toContain('cpf');
    });

    it('redacts sensitive values in output', () => {
        const chunks: string[] = [];

        const destination = {
            write(message: string): boolean {
                chunks.push(message);

                return true;
            },
        } satisfies {
            write(message: string): boolean;
        };

        const logger = createLogger(
            {
                serviceName: 'auth-service',
                environment: 'test',
            },
            destination,
        );

        logger.info({ password: 'super-secret', visible: 'ok' }, 'log message');

        expect(chunks.join('')).not.toContain('super-secret');
        expect(chunks.join('')).toContain('visible');
        expect(withLogContext(logger, { correlation_id: '550e8400-e29b-41d4-a716-446655440000' })).toBeDefined();
    });
});
