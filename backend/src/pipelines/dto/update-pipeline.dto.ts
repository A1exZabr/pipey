import { PartialType } from '@nestjs/mapped-types';
import { CreatePipelineDto, CreateStageDto } from './create-pipeline.dto';

export class UpdatePipelineDto extends PartialType(CreatePipelineDto) {}
export class UpdateStageDto extends PartialType(CreateStageDto) {}
