import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductModule } from './modules/product/product.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ProductModule, ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env'
  })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
