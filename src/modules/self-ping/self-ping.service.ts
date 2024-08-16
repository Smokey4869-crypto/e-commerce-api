import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SelfPingService {
  private readonly logger = new Logger(SelfPingService.name);
  private readonly url = process.env.SELF_PING_URL || 'http://localhost:3000/'; // Update with your Render URL
  private readonly interval = process.env.SELF_PING_INTERVAL || 30000; // Interval in milliseconds (30 seconds)

  constructor() {
    this.startPinging();
  }

  startPinging() {
    setInterval(async () => {
      try {
        const response = await axios.get(this.url);
        this.logger.log(`Pinged ${this.url} at ${new Date().toISOString()}: Status Code ${response.status}`);
      } catch (error) {
        this.logger.error(`Error pinging ${this.url} at ${new Date().toISOString()}:`, error.message);
      }
    }, this.interval as number);
  }
}
