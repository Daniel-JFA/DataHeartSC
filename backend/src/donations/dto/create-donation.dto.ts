import { IsString, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

export class CreateDonationDto {
  @IsString()
  clientId: string;

  @IsNumber()
  @IsPositive()
  @Min(0.01)
  amount: number;

  @IsString()
  paymentGateway: string;

  @IsString()
  transactionId: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  campaign?: string;

  @IsOptional()
  @IsString()
  concept?: string;

  @IsOptional()
  @IsString()
  date?: string;
}
