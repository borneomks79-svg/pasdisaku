import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { CategoriesModule } from './categories/categories.module';
import { PricingModule } from './pricing/pricing.module';
import { OrdersModule } from './orders/orders.module';
import { CrmWhatsappModule } from './crm-whatsapp/crm-whatsapp.module';
import { WoocommerceModule } from './woocommerce/woocommerce.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    PrismaModule,
    QueueModule,
    AuthModule,
    ProductsModule,
    SuppliersModule,
    CategoriesModule,
    PricingModule,
    OrdersModule,
    CrmWhatsappModule,
    WoocommerceModule,
  ],
})
export class AppModule {}
