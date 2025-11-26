import { Test, TestingModule } from '@nestjs/testing';
import { SaleOrdersService } from './sale-orders.service';

describe('SaleOrdersService', () => {
  let service: SaleOrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SaleOrdersService],
    }).compile();

    service = module.get<SaleOrdersService>(SaleOrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
