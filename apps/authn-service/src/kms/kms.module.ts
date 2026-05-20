import { Module } from '@nestjs/common';

import { EncryptionService } from './encryption.service.js';
import { KMS_PROVIDER } from './kms.token.js';
import { KmsHealthService } from './kms-health.service.js';
import { LocalKmsProvider } from './local-kms.provider.js';

@Module({
  providers: [
    LocalKmsProvider,
    { provide: KMS_PROVIDER, useExisting: LocalKmsProvider },
    EncryptionService,
    KmsHealthService,
  ],
  exports: [KMS_PROVIDER, EncryptionService, KmsHealthService],
})
export class KmsModule {}
