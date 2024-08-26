import { INestApplication, ValidationPipe } from '@nestjs/common';
import { SupabaseService } from '../src/modules/common/supabase.service';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ProductModule } from '../src/modules/product/product.module';
import { ProductDto } from '../src/modules/product/dto/product.dto';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

// Mocking SupabaseService
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

// Mocking authentication
const mockJwtService = {
  sign: jest.fn(() => 'mocked-jwt-token'),
  verify: jest.fn().mockImplementation(() => ({
    userId: 'admin-user-id',
    roles: ['admin'],
  })),
};

describe('Product Module (e2e)', () => {
  let app: INestApplication;
  let supabaseService: SupabaseService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, ProductModule],
    })
      .overrideProvider(SupabaseService)
      .useValue(mockSupabaseService)
      .overrideProvider(JwtService)
      .useValue(mockJwtService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    supabaseService = moduleFixture.get<SupabaseService>(SupabaseService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/products (GET) should return all products', async () => {
    const productDto: ProductDto[] = [
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
      },
    ];

    mockSupabaseService.getClient().select.mockResolvedValueOnce({
      data: productDto,
      error: null,
    });

    const response = await request(app.getHttpServer())
      .get('/products')
      .set('Authorization', 'Bearer mocked-jwt-token')
      .expect(200);

    expect(response.body).toEqual(productDto)
  });
});
