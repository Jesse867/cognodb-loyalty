import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator';

export class CreatePurchaseDto {
  @IsString()
  customerId: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @IsArray()
  items?: string[];
}
