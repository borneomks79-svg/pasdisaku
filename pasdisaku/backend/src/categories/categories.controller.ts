import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CategoriesService } from './categories.service';

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Post()
  create(
    @Body('name') name: string,
    @Body('slug') slug: string,
    @Body('parentId') parentId?: string,
    @Body('autoRule') autoRule?: any,
  ) {
    return this.categoriesService.create(name, slug, parentId, autoRule);
  }
}
