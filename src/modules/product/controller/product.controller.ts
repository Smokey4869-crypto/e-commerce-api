import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Res,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ProductService } from '../service/product.service';
import { ProductDto } from '../dto/product.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Response } from 'express';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async findAll(@Req() req: any): Promise<ProductDto[]> {
    const userRole = req.user.roles.includes('admin') ? 'admin' : 'user';
    return this.productService.findAll(userRole);
  }

  @Get(':id')
  async findOne(@Param('id') id: number, @Req() req: any): Promise<ProductDto> {
    const userRole = req.user.roles.includes('admin') ? 'admin' : 'user';
    return this.productService.findOne(id, userRole);
  }

  @Post()
  @Roles('admin')
  @UseGuards(RolesGuard)
  async create(@Body() product: ProductDto, @Res() res: Response) {
    const result = await this.productService.create(product);

    if (result && 'error' in result) {
      return res
        .status(result.statusCode)
        .json({ error: result.error, details: result.details });
    }

    return res.status(HttpStatus.CREATED).json(result);
  }

  @Put(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async update(
    @Param('id') id: number,
    @Body() updateProductDto: Partial<ProductDto>,
    @Res() res: Response,
  ) {
    const result = await this.productService.update(id, updateProductDto);

    if ('error' in result) {
      return res
        .status(result.statusCode)
        .json({ error: result.error, details: result.details });
    }

    return res.status(HttpStatus.OK).json(result);
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async delete(@Param('id') id: number, @Res() res: Response) {
    const result = await this.productService.delete(id);

    if (typeof result === 'object' && 'error' in result) {
      return res
        .status(result.statusCode)
        .json({ error: result.error, details: result.details });
    }

    return res.status(HttpStatus.NO_CONTENT).json();
  }
}
