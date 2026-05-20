import { type ArgumentsHost, HttpStatus, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { ProblemDetailsException } from '../../src/shared/problem-details.exception.js';
import { ProblemDetailsFilter } from '../../src/shared/problem-details.filter.js';

interface MockHostSpies {
  readonly send: ReturnType<typeof vi.fn>;
  readonly setHeader: ReturnType<typeof vi.fn>;
  readonly status: ReturnType<typeof vi.fn>;
}

const buildHost = (url = '/x'): { host: ArgumentsHost; spies: MockHostSpies } => {
  const spies: MockHostSpies = {
    send: vi.fn(),
    setHeader: vi.fn(),
    status: vi.fn().mockReturnThis(),
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ url }),
      getResponse: () => ({
        send: spies.send,
        setHeader: spies.setHeader,
        status: spies.status,
      }),
    }),
  } as unknown as ArgumentsHost;
  return { host, spies };
};

describe('ProblemDetailsFilter', () => {
  const filter = new ProblemDetailsFilter();

  it('preserva ProblemDetailsException body e seta Content-Type application/problem+json', () => {
    const { host, spies } = buildHost('/users/abc');
    filter.catch(
      new ProblemDetailsException({
        detail: 'Tenant abc does not exist',
        status: HttpStatus.NOT_FOUND,
        title: 'Resource not found',
        type: 'https://docs.mais-inclusao/errors/not-found',
      }),
      host,
    );

    expect(spies.setHeader).toHaveBeenCalledWith('Content-Type', 'application/problem+json');
    expect(spies.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(spies.send).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: 'Tenant abc does not exist',
        instance: '/users/abc',
        status: HttpStatus.NOT_FOUND,
        type: 'https://docs.mais-inclusao/errors/not-found',
      }),
    );
  });

  it('wrappa Nest legacy exception em ProblemDetails com defaults', () => {
    const { host, spies } = buildHost();
    filter.catch(new NotFoundException('User not found'), host);

    expect(spies.send).toHaveBeenCalled();
    const [firstCall] = spies.send.mock.calls;
    expect(firstCall).toBeDefined();
    const body = (firstCall as unknown[])[0] as Record<string, unknown>;
    expect(body.type).toBeDefined();
    expect(body.status).toBe(HttpStatus.NOT_FOUND);
    expect(body.instance).toBe('/x');
  });

  it('erro não-HTTP vira 500 internal', () => {
    const { host, spies } = buildHost('/boom');
    filter.catch(new Error('database died'), host);

    expect(spies.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(spies.send).toHaveBeenCalledWith(
      expect.objectContaining({
        instance: '/boom',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        title: 'Internal server error',
        type: expect.stringContaining('internal') as string,
      }),
    );
  });
});
