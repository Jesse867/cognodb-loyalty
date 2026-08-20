import { Controller, Get, Post, Body, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  async create(@Body() dto: CreatePurchaseDto) {
    try {
      return await this.purchasesService.create(dto);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async findAll(@Query('customerId') customerId?: string, @Query('storeId') storeId?: string) {
    try {
      return await this.purchasesService.findAll({ customerId, storeId });
    } catch (err) {
      throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const purchase = await this.purchasesService.findOne(id);
      if (!purchase) throw new HttpException('Purchase not found', HttpStatus.NOT_FOUND);
      return purchase;
    } catch (err) {
      if (err.status === 404) throw err;
      throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}
