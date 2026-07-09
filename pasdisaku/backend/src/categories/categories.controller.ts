import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { CategoriesService } from './categories.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Post()
  @Roles('super_admin', 'operator')
  create(
    @Body('name') name: string,
    @Body('slug') slug: string,
    @Body('parentId') parentId?: string,
    @Body('autoRule') autoRule?: any,
  ) {
    return this.categoriesService.create(name, slug, parentId, autoRule);
  }

  @Patch(':id')
  @Roles('super_admin', 'operator')
  update(
    @Param('id') id: string,
    @Body('name') name?: string,
    @Body('slug') slug?: string,
    @Body('parentId') parentId?: string,
    @Body('autoRule') autoRule?: any,
  ) {
    return this.categoriesService.update(id, name, slug, parentId, autoRule);
  }

  @Delete(':id')
  @Roles('super_admin')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
