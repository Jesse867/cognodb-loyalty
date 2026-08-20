import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver } from 'neo4j-driver';

export const NEO4J_DRIVER = Symbol('NEO4J_DRIVER');

@Global()
@Module({
  providers: [
    {
      provide: NEO4J_DRIVER,
      useFactory: (config: ConfigService): Driver => {
        const uri = config.get<string>('COGNO_URI');
        const user = config.get<string>('COGNO_USER', 'cognodb');
        const password = config.get<string>('COGNO_PASSWORD');

        if (!uri || !password) {
          throw new Error('COGNO_URI and COGNO_PASSWORD must be set in environment');
        }

        const driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
          connectionAcquisitionTimeout: 30000,
          maxConnectionPoolSize: 50,
        });

        // Verify connectivity on startup
        driver.verifyConnectivity()
          .then(() => console.log('✅ Connected to CognoDB'))
          .catch((err) => {
            console.error('❌ CognoDB connection failed:', err.message);
            process.exit(1);
          });

        return driver;
      },
      inject: [ConfigService],
    },
  ],
  exports: [NEO4J_DRIVER],
})
export class DatabaseModule {}
