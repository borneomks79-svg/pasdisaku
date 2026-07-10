import { BadRequestException, Body, Controller, Get, NotFoundException, Post, Query } from '@nestjs/common';
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
    const normalizedPhone = this.normalizePhone(dto.customerPhone);

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerName: dto.customerName,
        customerPhone: normalizedPhone,
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

    // Simpan/perbarui kontak ini ke database CRM WhatsApp secara otomatis,
    // supaya nomor pembeli langsung siap dipakai untuk broadcast promo.
    try {
      await this.prisma.waContact.upsert({
        where: { phone: normalizedPhone },
        update: { name: dto.customerName },
        create: { name: dto.customerName, phone: normalizedPhone },
      });
    } catch {
      // Tidak kritis kalau gagal — proses checkout tetap lanjut.
    }

    return {
      orderNumber: order.orderNumber,
      totalAmount: Number(order.totalAmount),
      status: order.status,
    };
  }

  /**
   * Lacak pesanan tanpa perlu akun/login — cukup nomor pesanan + nomor HP
   * (dicocokkan) untuk verifikasi sederhana, supaya orang lain tidak bisa
   * asal menebak nomor pesanan orang lain.
   */
  @Get('track')
  async track(@Query('orderNumber') orderNumber: string, @Query('phone') phone: string) {
    if (!orderNumber || !phone) {
      throw new BadRequestException('Nomor pesanan dan nomor HP wajib diisi.');
    }

    const normalizedPhone = this.normalizePhone(phone);

    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { items: { include: { product: true } } },
    });

    if (!order || order.customerPhone !== normalizedPhone) {
      throw new NotFoundException('Pesanan tidak ditemukan. Cek kembali nomor pesanan dan nomor HP.');
    }

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt,
      items: order.items.map((i) => ({
        name: i.product?.name || 'Produk',
        quantity: i.quantity,
        subtotal: Number(i.subtotal),
      })),
    };
  }

  private normalizePhone(raw: string): string {
    let s = String(raw || '').replace(/\D/g, '');
    if (s.startsWith('0')) s = '62' + s.slice(1);
    if (!s.startsWith('62') && s.length > 0) s = '62' + s;
    return s;
  }
}
