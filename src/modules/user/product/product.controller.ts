import { Controller, Get, Param, Res } from '@nestjs/common';
import { ProductService } from './product.service';
import { PlantRow } from '../../../models/product';
import { ErrorOr } from '../../../errors/error-or';

@Controller('product')
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    @Get()
    async getAllPlants(): Promise<ErrorOr<PlantRow[]>> {
        return this.productService.fetchAllPlants();
    }

    @Get(':productId')
    async getPlant(@Param('productId') productId: number): Promise<ErrorOr<PlantRow>> {
        return this.productService.fetchPlant(productId);
    }
}
