import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  UseGuards,
  Query,
  Delete,
  InternalServerErrorException,
} from '@nestjs/common';
import { FilesService } from './files.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileStorage } from './storage';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserId } from 'src/auth/decorators/user-id.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { FileType } from './entities/file.entity';
import { WatermarksService } from 'src/watermarks/watermarks.service';
import * as path from 'path';
import * as multer from 'multer';

@Controller('files')
@ApiTags('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly watermarkService: WatermarksService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get files list' })
  @ApiQuery({ name: 'type', required: false, enum: FileType })
  @ApiQuery({ name: 'folderId', required: false })
  @ApiResponse({ status: 200, description: 'Returns files list' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAll(
    @Query('type') fileType: FileType,
    @Query('folderId') folderId: number,
  ) {
    try {
      return await this.filesService.findAll(fileType, folderId);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 })],
      }),
    )
    file: Express.Multer.File,
    @UserId() userId: number,
    @Query('folderId') folderId: string,
  ) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    let savedFile;

    if (imageExtensions.includes(fileExtension)) {
      const tempPath = `uploads/temp_${Date.now()}_${file.originalname}`;
      
      const fs = require('fs');
      fs.writeFileSync(tempPath, file.buffer);
      
      try {
        const watermarkedPath = await this.watermarkService.applyWatermark(
          tempPath,
          userId,
        );
        
        const watermarkedFile = {
          ...file,
          path: watermarkedPath,
          buffer: fs.readFileSync(watermarkedPath)
        };
        
        savedFile = await this.filesService.create(watermarkedFile, folderId);
        
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
        if (fs.existsSync(watermarkedPath) && watermarkedPath !== tempPath) {
          fs.unlinkSync(watermarkedPath);
        }
      } catch (error) {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
        throw error;
      }
    } else {
      savedFile = await this.filesService.create(file, folderId);
    }

    return savedFile;
  }

  @Delete()
  async remove(@Query('ids') ids: string, @Query('folderId') folderId: number) {
    try {
      return await this.filesService.remove(ids, folderId);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
