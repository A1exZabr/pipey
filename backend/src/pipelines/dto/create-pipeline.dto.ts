import { IsString, IsBoolean, IsOptional, IsInt, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStageDto {
  @IsString()
  name: string;

  @IsInt()
  order: number;

  @IsOptional()
  @IsString()
  color?: string;
}

export class CreatePipelineDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStageDto)
  stages?: CreateStageDto[];
}
