import 'dotenv/config';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }

    const adapter = new PrismaPg({ connectionString });
    super({ adapter }); // eslint-disable-line @typescript-eslint/no-unsafe-call
  }

  async onModuleInit() {
    await this.$connect(); // eslint-disable-line @typescript-eslint/no-unsafe-call
  }
}
