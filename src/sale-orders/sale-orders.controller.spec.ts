import { Test, TestingModule } from '@nestjs/testing';
import { SaleOrdersController } from './sale-orders.controller';
import { SaleOrdersService } from './sale-orders.service';

describe('SaleOrdersController', () => {
  let controller: SaleOrdersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SaleOrdersController],
      providers: [SaleOrdersService],
    }).compile();

    controller = module.get<SaleOrdersController>(SaleOrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
