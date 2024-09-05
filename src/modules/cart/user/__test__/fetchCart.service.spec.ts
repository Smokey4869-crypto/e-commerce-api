import { Test, TestingModule } from '@nestjs/testing';
import { UserCartService } from '../user-cart.service';
import { SupabaseService } from '../../../common/supabase.service';

const mockSupabaseService = {
  getClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    single: jest.fn(),
  }),
};

describe('UserCartService', () => {
  let service: UserCartService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserCartService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<UserCartService>(UserCartService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fetchCart', () => {
    it('should fetch a cart by userId when active cart exists', async () => {
      const mockCart = { id: 'cart1', cart_items: [] };

      mockSupabaseService.getClient().select.mockReturnValueOnce({
        eq: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest
              .fn()
              .mockResolvedValueOnce({ data: mockCart, error: null }),
          }),
        }),
      });

      const result = await service.fetchCart('user1');
      expect(result).toEqual(mockCart);
    });

    it('should create a new cart if no active cart exists for userId', async () => {
      const newCart = { id: 'newCart', cart_items: [] };

      mockSupabaseService.getClient().select.mockReturnValueOnce({
        eq: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValue({
            single: jest
              .fn()
              .mockResolvedValueOnce({ data: null, error: null }),
          }),
        }),
      });

      mockSupabaseService.getClient().insert.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          single: jest
            .fn()
            .mockResolvedValueOnce({ data: newCart, error: null }),
        }),
      });

      const result = await service.fetchCart('user1');
      expect(result).toEqual(newCart);
    });

    it('should fetch a cart by cartId when active cart exists', async () => {
      const mockCart = { id: 'cart1', cart_items: [] };

      mockSupabaseService.getClient().select.mockReturnValueOnce({
        eq: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest
              .fn()
              .mockResolvedValueOnce({ data: mockCart, error: null }),
          }),
        }),
      });

      const result = await service.fetchCart(undefined, 'cart1');
      expect(result).toEqual(mockCart);
    });

    it('should create a new cart if no active cart exists for cartId', async () => {
      const newCart = { id: 'newCart', cart_items: [] };

      mockSupabaseService.getClient().select.mockReturnValueOnce({
        eq: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest
              .fn()
              .mockResolvedValueOnce({ data: null, error: null }),
          }),
        }),
      });

      mockSupabaseService.getClient().insert.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          single: jest
            .fn()
            .mockResolvedValueOnce({ data: newCart, error: null }),
        }),
      });

      const result = await service.fetchCart(undefined, 'cart1');
      expect(result).toEqual(newCart);
    });

    it('should return a 400 error if no userId or cartId is provided', async () => {
      const result = await service.fetchCart();
      expect(result).toEqual({
        error: 'Bad Request: No cart or user identifier provided',
        statusCode: 400,
      });
    });

    it('should return a 500 error if an error occurs during fetch', async () => {
      mockSupabaseService.getClient().select.mockReturnValueOnce({
        eq: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockRejectedValueOnce(new Error('Fetch Error')),
          }),
        }),
      });

      const result = await service.fetchCart('user1');
      expect(result).toEqual({
        error: 'Unable to fetch cart',
        details: 'Fetch Error',
        statusCode: 500,
      });
    });

    it('should return a 500 error if an error occurs during cart creation', async () => {
      mockSupabaseService.getClient().select.mockReturnValueOnce({
        eq: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest
              .fn()
              .mockResolvedValueOnce({ data: null, error: null }),
          }),
        }),
      });

      mockSupabaseService.getClient().insert.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          single: jest.fn().mockResolvedValueOnce({
            data: null,
            error: { message: 'Creation Error' },
          }),
        }),
      });

      const result = await service.fetchCart('user1');
      expect(result).toEqual({
        error: 'Unable to create a new cart',
        details: 'Creation Error',
        statusCode: 500,
      });
    });
  });
});
