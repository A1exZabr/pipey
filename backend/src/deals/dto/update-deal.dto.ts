import { PartialType } from '@nestjs/mapped-types';
import { IsString } from 'class-validator';
import { CreateDealDto } from './create-deal.dto';

export class UpdateDealDto extends PartialType(CreateDealDto) {}

export class MoveDealDto {
  @IsString()
  stageId: string;
}
