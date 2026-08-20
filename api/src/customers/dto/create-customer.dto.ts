import { IsString, IsEmail, IsOptional, IsIn } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  referredBy?: string;

  @IsOptional()
  @IsIn(['Bronze', 'Silver', 'Gold', 'VIP'])
  tier?: string = 'Bronze';
}
