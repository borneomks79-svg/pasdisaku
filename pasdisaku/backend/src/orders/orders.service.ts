import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(status?: string) {
    const orders = await this.prisma.order.findMany({
      where: status ? { status: status as any } : undefined,
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(this.serialize);
  }

  async create(dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order harus memiliki minimal 1 item');
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: dto.items.map((i) => BigInt(i.productId)) } },
    });

    let total = 0;
    const orderItemsData = dto.items.map((item) => {
      const product = products.find((p) => p.id === BigInt(item.productId));
      if (!product) throw new BadRequestException(`Produk ${item.productId} tidak ditemukan`);
      const subtotal = Number(product.salePrice) * item.quantity;
      total += subtotal;
      return {
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.salePrice,
        subtotal,
      };
    });

    const orderNumber = `ORD-${Date.now()}`;

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        customerAddress: dto.customerAddress,
        totalAmount: total,
        items: { create: orderItemsData },
      },
      include: { items: { include: { product: true } } },
    });

    return this.serialize(order);
  }

  async updateStatus(id: string, status: string) {
    const order = await this.prisma.order.update({
      where: { id: BigInt(id) },
      data: { status: status as any },
    });
    return this.serialize(order);
  }

  private serialize(order: any) {
    return {
      ...order,
      id: order.id?.toString(),
      items: order.items?.map((item: any) => ({
        ...item,
        id: item.id.toString(),
        orderId: item.orderId.toString(),
        productId: item.productId.toString(),
        product: item.product ? { ...item.product, id: item.product.id.toString() } : undefined,
      })),
    };
  }
}
