import { Controller, Get, Post, Body, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  async create(@Body() dto: CreateCustomerDto) {
    try {
      return await this.customersService.create(dto);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async findAll(@Query('tier') tier?: string, @Query('search') search?: string) {
    try {
      return await this.customersService.findAll({ tier, search });
    } catch (err) {
      throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const customer = await this.customersService.findOne(id);
      if (!customer) throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
      return customer;
    } catch (err) {
      if (err.status === 404) throw err;
      throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Get(':id/network')
  async getNetwork(@Param('id') id: string, @Query('depth') depth: string = '2') {
    try {
      return await this.customersService.getNetwork(id, parseInt(depth, 10));
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Get(':id/purchases')
  async getPurchases(@Param('id') id: string) {
    try {
      return await this.customersService.getPurchases(id);
    } catch (err) {
      throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}
