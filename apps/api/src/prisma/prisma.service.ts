import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    // Parse and log database connection details
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
      try {
        const url = new URL(databaseUrl);
        const dbHost = url.hostname;
        const dbPort = url.port || '5432';
        const dbName = url.pathname.substring(1); // Remove leading slash
        
        this.logger.log(`Connecting to database: ${dbHost}:${dbPort}/${dbName}`);
      } catch (error) {
        this.logger.warn('Could not parse DATABASE_URL for logging');
      }
    } else {
      this.logger.warn('DATABASE_URL not found in environment variables');
    }

    this.logger.log('Connecting to database');
    try {
      await this.$connect();
      this.logger.log('Connected to database');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }
}
