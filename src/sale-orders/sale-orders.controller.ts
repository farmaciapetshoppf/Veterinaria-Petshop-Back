import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SaleOrdersService } from './sale-orders.service';
import { CreateSaleOrderDto } from './dto/create-sale-order.dto';
import { UpdateSaleOrderDto } from './dto/update-sale-order.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Sale Orders')
@Controller('sale-orders')
export class SaleOrdersController {
  constructor(private readonly saleOrdersService: SaleOrdersService) {}

  @ApiOperation({ summary: 'Create new sale order' })
  @Post()
  create(@Body() createSaleOrderDto: CreateSaleOrderDto) {
    return this.saleOrdersService.create(createSaleOrderDto);
  }

  @ApiOperation({ summary: 'Get all sale orders' })
  @Get()
  findAll() {
    return this.saleOrdersService.findAll();
  }

  @ApiOperation({ summary: 'Get sale order by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.saleOrdersService.findOne(+id);
  }

  @ApiOperation({ summary: 'Update sale order' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSaleOrderDto: UpdateSaleOrderDto,
  ) {
    return this.saleOrdersService.update(+id, updateSaleOrderDto);
  }

  @ApiOperation({ summary: 'Delete sale order' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.saleOrdersService.remove(+id);
  }
}
