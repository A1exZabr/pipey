import { IsString, IsOptional, IsNumber, IsDecimal } from 'class-validator';

export class CreateDealDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  pipelineId: string;

  @IsString()
  stageId: string;

  @IsOptional()
  @IsString()
  contactId?: string;
}
