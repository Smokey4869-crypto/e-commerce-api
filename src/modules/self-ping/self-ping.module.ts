import { Module } from '@nestjs/common';
import { SelfPingService } from './self-ping.service';

@Module({
  providers: [SelfPingService],
})
export class SelfPingModule {}
