import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SizeEntity } from './entities/size.entity';
import { SizeController } from './sizes.controller';
import { SizeService } from './sizes.service';

@Module({
  imports: [TypeOrmModule.forFeature([SizeEntity])],
  controllers: [SizeController],
  providers: [SizeService],
  exports: [TypeOrmModule, SizeService],
})
export class SizeModule {}