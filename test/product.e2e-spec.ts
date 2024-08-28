import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { SupabaseService } from '../src/modules/common/supabase.service';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';

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

describe('Product Module (e2e)', () => {
  let app: INestApplication;
  let supabaseService: SupabaseService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SupabaseService)
      .useValue(mockSupabaseService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    supabaseService = moduleFixture.get<SupabaseService>(SupabaseService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Admin role tests', () => {
    it('/products (GET) should return all fields for admin users', async () => {
      const mockProducts = [
          {
              productid: 101,
              name: 'Test Product',
              link: 'http://testproduct.com',
              description: 'A product for testing',
              product_include: 'Test include',
              harvest_cycle: '2 months',
              flavour_characteristics: 'Sweet',
              height: '50cm',
              width: '30cm',
              care_technique: 'Simple care',
              harvesting_technique: 'Manual',
              image_urls: ['http://image1.com'],
              slug: 'test-product',
              price: 19.99,
              price_id: 'price_123',
              category: 'Test Category',
              sensitive_field: 'admin-only data',
          },
      ];

      mockSupabaseService.getClient().select.mockResolvedValueOnce({
          data: mockProducts,
          error: null,
      });

      const response = await request(app.getHttpServer())
          .get('/products')
          .set('x-test-roles', 'admin') // Custom header for admin role
          .expect(200);

      expect(response.body).toEqual(mockProducts); // Admin should see all fields
  });

    it('/products (POST) should allow an admin to create a product', async () => {
      const mockProduct = {
        productid: 101,
        name: 'Test Product',
        link: 'http://testproduct.com',
        description: 'A product for testing',
        product_include: 'Test include',
        harvest_cycle: '2 months',
        flavour_characteristics: 'Sweet',
        height: '50cm',
        width: '30cm',
        care_technique: 'Simple care',
        harvesting_technique: 'Manual',
        image_urls: ['http://image1.com'],
        slug: 'test-product',
        price: 19.99,
        price_id: 'price_123',
        category: 'Test Category',
      };

      mockSupabaseService.getClient().insert.mockReturnValue({
        select: jest.fn().mockResolvedValueOnce({
          data: [mockProduct],
          error: null,
        }),
      });

      const response = await request(app.getHttpServer())
        .post('/products')
        .set('x-test-roles', 'admin') // Custom header for admin role
        .send(mockProduct)
        .expect(201);

      expect(response.body).toEqual(mockProduct);
    });

    it('/products (PUT) should allow an admin to update a product', async () => {
      const updatedProduct = {
        productid: 101,
        name: 'Updated Product',
        link: 'http://testproduct.com',
        description: 'Updated description',
        product_include: 'Test include',
        harvest_cycle: '2 months',
        flavour_characteristics: 'Sweet',
        height: '50cm',
        width: '30cm',
        care_technique: 'Simple care',
        harvesting_technique: 'Manual',
        image_urls: ['http://image1.com'],
        slug: 'updated-product',
        price: 29.99,
        price_id: 'price_123',
        category: 'Updated Category',
      };

      mockSupabaseService.getClient().update.mockReturnValueOnce({
        eq: jest.fn().mockReturnValueOnce({
          select: jest.fn().mockResolvedValueOnce({
            data: [updatedProduct],
            error: null,
          }),
        }),
      });

      const response = await request(app.getHttpServer())
        .put(`/products/${updatedProduct.productid}`)
        .set('x-test-roles', 'admin') // Custom header for admin role
        .send({ name: 'Updated Product' })
        .expect(200);

      expect(response.body).toEqual(updatedProduct);
    });

    it('/products (DELETE) should allow an admin to delete a product', async () => {
      mockSupabaseService.getClient().delete.mockReturnValueOnce({
        eq: jest.fn().mockResolvedValueOnce({ data: null, error: null }),
      });

      await request(app.getHttpServer())
        .delete('/products/101')
        .set('x-test-roles', 'admin') // Custom header for admin role
        .expect(204);
    });
  });

  describe('Normal user role tests', () => {
    it('/products (GET) should hide sensitive fields for normal users', async () => {
      const mockProducts = [
          {
              productid: 101,
              name: 'Test Product',
              link: 'http://testproduct.com',
              description: 'A product for testing',
              product_include: 'Test include',
              harvest_cycle: '2 months',
              flavour_characteristics: 'Sweet',
              height: '50cm',
              width: '30cm',
              care_technique: 'Simple care',
              harvesting_technique: 'Manual',
              image_urls: ['http://image1.com'],
              slug: 'test-product',
              price: 19.99,
              price_id: 'price_123',
              category: 'Test Category',
              sensitive_field: 'admin-only data', // This field should be hidden
          },
      ];

      mockSupabaseService.getClient().select.mockResolvedValueOnce({
          data: mockProducts,
          error: null,
      });

      const response = await request(app.getHttpServer())
          .get('/products')
          .set('x-test-roles', 'user') // Custom header for normal user role
          .expect(200);

      const expectedResponse = [
          {
              productid: 101,
              name: 'Test Product',
              link: 'http://testproduct.com',
              description: 'A product for testing',
              product_include: 'Test include',
              harvest_cycle: '2 months',
              flavour_characteristics: 'Sweet',
              height: '50cm',
              width: '30cm',
              care_technique: 'Simple care',
              harvesting_technique: 'Manual',
              image_urls: ['http://image1.com'],
              slug: 'test-product',
              price: 19.99,
              price_id: 'price_123',
              category: 'Test Category',
              // sensitive_field is intentionally missing
          },
      ];

      expect(response.body).toEqual(expectedResponse); // Sensitive fields should be hidden
  });

    it('/products (POST) should return 403 if a normal user tries to create a product', async () => {
      const mockProduct = {
        productid: 101,
        name: 'Test Product',
        link: 'http://testproduct.com',
        description: 'A product for testing',
        product_include: 'Test include',
        harvest_cycle: '2 months',
        flavour_characteristics: 'Sweet',
        height: '50cm',
        width: '30cm',
        care_technique: 'Simple care',
        harvesting_technique: 'Manual',
        image_urls: ['http://image1.com'],
        slug: 'test-product',
        price: 19.99,
        price_id: 'price_123',
        category: 'Test Category',
      };

      mockSupabaseService.getClient().insert.mockReturnValueOnce({
        select: jest
          .fn()
          .mockResolvedValueOnce({ data: [mockProduct], error: null }),
      });

      const response = await request(app.getHttpServer())
        .post('/products')
        .set('x-test-roles', 'user') // Custom header for normal user role
        .send(mockProduct)
        .expect(403);

      expect(response.body).toEqual({
        statusCode: 403,
        error: 'Forbidden',
        message: 'You do not have permission to access this resource',
      });
    });

    it('/products (PUT) should return 403 if a normal user tries to update a product', async () => {
      const updatedProduct = {
        productid: 101,
        name: 'Updated Product',
      };

      await request(app.getHttpServer())
        .put(`/products/${updatedProduct.productid}`)
        .set('x-test-roles', 'user') // Custom header for normal user role
        .send({ name: 'Updated Product' })
        .expect(403);
    });

    it('/products (DELETE) should return 403 if a normal user tries to delete a product', async () => {
      await request(app.getHttpServer())
        .delete('/products/101')
        .set('x-test-roles', 'user') // Custom header for normal user role
        .expect(403);
    });
  });
});
