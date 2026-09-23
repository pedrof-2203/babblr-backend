import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { config, database, up } from 'migrate-mongo';
import { join } from 'node:path';

@Injectable()
export class DbMigrationService implements OnModuleInit {
  private readonly dbMigrationConfig: Partial<config.Config>;

  constructor(private readonly configService: ConfigService) {
    this.dbMigrationConfig = {
      mongodb: {
        databaseName: this.configService.getOrThrow<string>('DB_NAME'),
        url: this.configService.getOrThrow<string>('MONGODB_URI'),
      },
      migrationsDir: join(__dirname, '../../migrations'),
      changelogCollectionName: 'changelog',
      migrationFileExtension: '.js',
    };
  }

  async onModuleInit(): Promise<void> {
    config.set(this.dbMigrationConfig);

    const { db, client } = await database.connect();

    await up(db, client);
  }
}