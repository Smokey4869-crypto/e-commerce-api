import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from '../service/product.service';
import { SupabaseService } from '../../common/supabase.service';
import { ProductDto } from '../dto/product.dto';
import { NotFoundException } from '@nestjs/common';

const mockSupabaseService = {
  getClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    single: jest.fn(),
  }),
};

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of products', async () => {
      const mockProducts: ProductDto[] = [
        {
          productid: 1,
          name: 'Product 1',
          link: '',
          description: '',
          product_include: '',
          harvest_cycle: '',
          flavour_characteristics: '',
          height: '',
          width: '',
          care_technique: '',
          harvesting_technique: '',
          image_urls: [],
          slug: '',
          price: 10,
          price_id: '',
          category: '',
        },
      ];

      mockSupabaseService
        .getClient()
        .select.mockResolvedValue({ data: mockProducts });

      const result = await service.findAll('user');
      expect(result).toEqual(mockProducts);
    });

    it('should throw a NotFoundException if no products are found', async () => {
      mockSupabaseService.getClient().select.mockResolvedValue({ data: null });

      await expect(service.findAll('user')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return a single product', async () => {
      const mockProduct: ProductDto = {
        productid: 1,
        name: 'Product 1',
        link: '',
        description: '',
        product_include: '',
        harvest_cycle: '',
        flavour_characteristics: '',
        height: '',
        width: '',
        care_technique: '',
        harvesting_technique: '',
        image_urls: [],
        slug: '',
        price: 10,
        price_id: '',
        category: '',
      };

      mockSupabaseService.getClient().select.mockReturnValueOnce({
        eq: jest.fn().mockReturnValueOnce({
          single: jest
            .fn()
            .mockResolvedValueOnce({ data: mockProduct, error: null }),
        }),
      });

      const result = await service.findOne(1, 'user');
      expect(result).toEqual(mockProduct);
    });

    it('should throw a NotFoundException if product is not found', async () => {
      mockSupabaseService.getClient().select.mockReturnValueOnce({
        eq: jest.fn().mockReturnValueOnce({
          single: jest.fn().mockResolvedValueOnce({ data: null }),
        }),
      });

      await expect(service.findOne(1, 'user')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create and return the new product', async () => {
      const mockProduct: ProductDto = {
        productid: 1,
        name: 'Product 1',
        link: '',
        description: '',
        product_include: '',
        harvest_cycle: '',
        flavour_characteristics: '',
        height: '',
        width: '',
        care_technique: '',
        harvesting_technique: '',
        image_urls: [],
        slug: '',
        price: 10,
        price_id: '',
        category: '',
      };

      mockSupabaseService.getClient().insert.mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce({
          data: [mockProduct],
          error: null,
        }),
      });

      const result = await service.create(mockProduct);
      expect(result).toEqual(mockProduct);
    });

    it('should return an error if product creation falls', async () => {
      mockSupabaseService.getClient().insert.mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce({
          data: null,
          error: { message: 'Error creating product', code: '23505' },
        }),
      });
      const result = await service.create({
        productid: 1,
        name: 'New Product',
      } as ProductDto);
      expect(result).toEqual({
        error: 'Error creating product',
        details: 'Error creating product',
        statusCode: 409,
      });
    });
  });

  describe('update', () => {
    it('should update and return the product', async () => {
      const mockProduct: ProductDto = {
        productid: 1,
        name: 'Updated Product',
        link: '',
        description: '',
        product_include: '',
        harvest_cycle: '',
        flavour_characteristics: '',
        height: '',
        width: '',
        care_technique: '',
        harvesting_technique: '',
        image_urls: [],
        slug: '',
        price: 30,
        price_id: '',
        category: '',
      };
      mockSupabaseService.getClient().update.mockReturnValueOnce({
        eq: jest.fn().mockReturnValueOnce({
          select: jest.fn().mockResolvedValueOnce({
            data: [mockProduct],
            error: null,
          }),
        }),
      });

      const result = await service.update(1, { name: 'Updated Product' });
      expect(result).toEqual(mockProduct);
    });

    it('should return an error if product update fails', async () => {
      mockSupabaseService.getClient().update.mockReturnValueOnce({
        eq: jest.fn().mockReturnValueOnce({
          select: jest.fn().mockResolvedValueOnce({
            data: null,
            error: { message: 'Error updating product', code: '23505' },
          }),
        }),
      });

      const result = await service.update(1, { name: 'Update Product' });
      expect(result).toEqual({
        error: `Product with ID 1 not found`,
        details: 'Error updating product',
        statusCode: 404,
      });
    });
  });

  describe('delete', () => {
    it('should delete the product successfully', async () => {
      mockSupabaseService.getClient().delete.mockReturnValueOnce({
        eq: jest.fn().mockResolvedValueOnce({ data: null, error: null }),
      });

      const result = await service.delete(1);
      expect(result).toBeUndefined();
    });

    it('should return an error if product deletion fails', async () => {
      mockSupabaseService.getClient().delete.mockReturnValue({
        eq: jest.fn().mockResolvedValueOnce({
          error: { message: 'Error deleting product', code: '23505' },
        }),
      });

      const result = await service.delete(1);
      expect(result).toEqual({
        error: 'Product with ID 1 not found',
        details: 'Error deleting product',
        statusCode: 404,
      });
    });
  });
});
