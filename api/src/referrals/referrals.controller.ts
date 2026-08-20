import { Controller, Get, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ReferralsService } from './referrals.service';

@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('leaderboard')
  async getLeaderboard(@Query('limit') limit: string = '10') {
    try {
      return await this.referralsService.getLeaderboard(parseInt(limit, 10));
    } catch (err) {
      throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Get('longest-chain')
  async getLongestChain() {
    try {
      return await this.referralsService.getLongestChain();
    } catch (err) {
      throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Get('vip-network')
  async getVipNetwork(@Query('depth') depth: string = '2') {
    try {
      return await this.referralsService.getVipNetwork(parseInt(depth, 10));
    } catch (err) {
      throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Get(':id/tree-revenue')
  async getTreeRevenue(@Param('id') id: string) {
    try {
      return await this.referralsService.getTreeRevenue(id);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Get(':id/graph')
  async getGraphData(@Param('id') id: string, @Query('depth') depth: string = '3') {
    try {
      return await this.referralsService.getGraphData(id, parseInt(depth, 10));
    } catch (err) {
      throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}
