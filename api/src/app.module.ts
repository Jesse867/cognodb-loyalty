import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CustomersModule } from './customers/customers.module';
import { PurchasesModule } from './purchases/purchases.module';
import { ReferralsModule } from './referrals/referrals.module';
import { StoresModule } from './stores/stores.module';
import { DatabaseModule } from './config/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    CustomersModule,
    PurchasesModule,
    ReferralsModule,
    StoresModule,
  ],
})
export class AppModule {}
