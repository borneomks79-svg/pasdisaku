import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { WoocommerceService } from './woocommerce.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('woocommerce')
export class WoocommerceController {
  constructor(private wcService: WoocommerceService) {}

  @Post('products/:id/push')
  @Roles('super_admin', 'operator')
  pushProduct(@Param('id') id: string) {
    return this.wcService.pushProduct(id);
  }

  @Post('sync/push-changed')
  @Roles('super_admin', 'operator')
  pushChanged(@Body('sinceMinutesAgo') sinceMinutesAgo: number = 60) {
    const since = new Date(Date.now() - sinceMinutesAgo * 60 * 1000);
    return this.wcService.pushChangedProducts(since);
  }

  @Post('orders/pull')
  @Roles('super_admin', 'operator')
  pullOrders() {
    return this.wcService.pullOrders();
  }
}
