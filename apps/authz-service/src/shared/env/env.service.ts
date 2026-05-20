import { Inject, Injectable } from '@nestjs/common';

import type { AppEnv } from './env.js';
import { APP_ENV } from './env.token.js';

/**
 * Service que expõe o AppEnv parseado de forma injetável.
 * Acesso via `envService.values.<KEY>` — TypeScript-completion-friendly.
 */
@Injectable()
export class EnvService {
  public constructor(@Inject(APP_ENV) public readonly values: AppEnv) {}
}
