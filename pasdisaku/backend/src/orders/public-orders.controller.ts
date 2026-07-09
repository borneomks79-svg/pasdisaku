import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CheckoutItemDto {
  productId: string;
  quantity: number;
}

interface CheckoutDto {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  shippingCost?: number;
  items: CheckoutItemDto[];
}

@Controller('public/orders')
export class PublicOrdersController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async create(@Body() dto: CheckoutDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Keranjang kosong.');
    }
    if (!dto.customerName || !dto.customerPhone || !dto.customerAddress) {
      throw new BadRequestException('Data pelanggan tidak lengkap.');
    }

    const productIds = dto.items.map((i) => BigInt(i.productId));
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, status: 'active' },
    });

    if (products.length !== dto.items.length) {
      throw new BadRequestException('Beberapa produk tidak tersedia lagi.');
    }

    let subtotalTotal = 0;
    const orderItemsData = dto.items.map((item) => {
      const product = products.find((p) => p.id.toString() === item.productId);
      if (!product) throw new BadRequestException('Produk tidak ditemukan.');
      const unitPrice = Number(product.salePrice);
      const subtotal = unitPrice * item.quantity;
      subtotalTotal += subtotal;
      return { productId: product.id, quantity: item.quantity, unitPrice, subtotal };
    });

    const shippingCost = Number(dto.shippingCost) || 0;
    const totalAmount = subtotalTotal + shippingCost;
    const orderNumber = `PSD-${Date.now()}`;

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        customerAddress: dto.customerAddress,
        source: 'manual',
        status: 'pending',
        totalAmount,
        items: { create: orderItemsData },
      },
      include: { items: true },
    });

    for (const item of dto.items) {
      await this.prisma.product.update({
        where: { id: BigInt(item.productId) },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return {
      orderNumber: order.orderNumber,
      totalAmount: Number(order.totalAmount),
      status: order.status,
    };
  }
}
