import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { SuppliersService } from './suppliers.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private suppliersService: SuppliersService) {}

  @Get()
  findAll() {
    return this.suppliersService.findAll();
  }

  @Post()
  @Roles('super_admin', 'operator')
  create(@Body() body: any) {
    return this.suppliersService.create(body);
  }

  @Patch(':id')
  @Roles('super_admin', 'operator')
  update(@Param('id') id: string, @Body() body: any) {
    return this.suppliersService.update(id, body);
  }

  @Post(':id/import')
  @Roles('super_admin', 'operator')
  triggerImport(@Param('id') id: string) {
    return this.suppliersService.triggerImport(id);
  }

  @Post(':id/sync')
  @Roles('super_admin', 'operator')
  triggerSync(@Param('id') id: string) {
    return this.suppliersService.triggerSync(id);
  }
}
