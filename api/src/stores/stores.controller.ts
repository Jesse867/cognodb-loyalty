import { Controller, Get, Post, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  async create(@Body() dto: CreateStoreDto) {
    try {
      return await this.storesService.create(dto);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async findAll() {
    try {
      return await this.storesService.findAll();
    } catch (err) {
      throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const store = await this.storesService.findOne(id);
      if (!store) throw new HttpException('Store not found', HttpStatus.NOT_FOUND);
      return store;
    } catch (err) {
      if (err.status === 404) throw err;
      throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Get(':id/analytics')
  async getAnalytics(@Param('id') id: string) {
    try {
      return await this.storesService.getAnalytics(id);
    } catch (err) {
      throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}
