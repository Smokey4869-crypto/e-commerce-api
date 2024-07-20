import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { CommonModule } from '../../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [WebhookController],
  providers: [WebhookService]
})
export class WebhookModule {}
