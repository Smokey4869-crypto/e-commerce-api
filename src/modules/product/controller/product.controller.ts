import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ProductService } from '../service/product.service';
import { ProductEntity } from '../entities/product.entity';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async findAll(): Promise<ProductEntity[]> {
    return this.productService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<ProductEntity> {
    return this.productService.findOne(id);
  }

  @Post()
  @Roles('admin')
  @UseGuards(RolesGuard)
  async create(@Body() product: ProductEntity): Promise<ProductEntity> {
    return this.productService.create(product);
  }

  @Put(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async update(
    @Param('id') id: number,
    @Body() updateProductDto: Partial<ProductEntity>,
  ): Promise<ProductEntity> {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async remove(@Param('id') id: number): Promise<void> {
    return this.productService.remove(id);
  }
}
