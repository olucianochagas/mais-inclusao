import { Global, Module } from '@nestjs/common';

import { parseEnv } from './env.js';
import { EnvService } from './env.service.js';
import { APP_ENV } from './env.token.js';

/**
 * @Global porque env vars são consumidas em praticamente todo module.
 * Singleton — parse no bootstrap, sem mais I/O depois.
 */
@Global()
@Module({
  providers: [
    {
      provide: APP_ENV,
      useValue: parseEnv(process.env),
    },
    EnvService,
  ],
  exports: [APP_ENV, EnvService],
})
export class EnvModule {}
