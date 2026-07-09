import { Controller, Get } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('public/categories')
export class PublicCategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAllPublic();
  }
}
