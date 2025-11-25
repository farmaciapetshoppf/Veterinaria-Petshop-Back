import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SaleOrdersService } from './sale-orders.service';
import { CreateSaleOrderDto } from './dto/create-sale-order.dto';
import { UpdateSaleOrderDto } from './dto/update-sale-order.dto';

@Controller('sale-orders')
export class SaleOrdersController {
  constructor(private readonly saleOrdersService: SaleOrdersService) {}

  @Post()
  create(@Body() createSaleOrderDto: CreateSaleOrderDto) {
    return this.saleOrdersService.create(createSaleOrderDto);
  }

  @Get()
  findAll() {
    return this.saleOrdersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.saleOrdersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSaleOrderDto: UpdateSaleOrderDto) {
    return this.saleOrdersService.update(+id, updateSaleOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.saleOrdersService.remove(+id);
  }
}
