import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {  SizeEntity } from './entities/size.entity';
import {  CreateSizeDto } from './dto/create-size.dto';

@Injectable()
export class SizeService {
  constructor(
    @InjectRepository(SizeEntity)
    private repository: Repository<SizeEntity>,
  ) {}

  async create(dto: CreateSizeDto) {
    const size = this.repository.create({
      name: dto.name,
    });

    return this.repository.save(size);
  }

}