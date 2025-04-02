import { PartialType } from '@nestjs/swagger';
import { CreateWatermarkDto } from './create-watermark.dto';

export class UpdateWatermarkDto extends PartialType(CreateWatermarkDto) {}
