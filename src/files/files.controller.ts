import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  UseGuards,
  Query,
  Delete,
  InternalServerErrorException,
  BadRequestException,
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
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
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
      const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._\s\-()]/g, '_');
      const tempPath = `uploads/temp_${Date.now()}_${safeFileName}`;
      
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

  @Post('batch')
  @UseInterceptors(
    FilesInterceptor('files', 200, {
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 200, // Maximum 200 files
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload multiple files (up to 200 files)' })
  @ApiResponse({ status: 200, description: 'Files uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Too many files or invalid files' })
  async createBatch(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 })],
      }),
    )
    files: Express.Multer.File[],
    @UserId() userId: number,
    @Query('folderId') folderId: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (files.length > 200) {
      throw new BadRequestException('Too many files. Maximum 200 files allowed');
    }

    try {
      const results = await this.filesService.createBatch(files, folderId, userId);
      return {
        success: true,
        uploaded: results.length,
        files: results,
      };
    } catch (error) {
      throw new InternalServerErrorException(`Error uploading files: ${error.message}`);
    }
  }

  @Delete()
  async remove(@Query('ids') ids: string, @Query('folderId') folderId: number) {
    try {
      return await this.filesService.remove(ids, folderId);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Delete('folder')
  @ApiOperation({ summary: 'Delete all files in folder (async - fast response)' })
  @ApiQuery({ name: 'folderId', required: true, description: 'Folder ID to delete all files from' })
  @ApiResponse({ 
    status: 200, 
    description: 'Files marked for deletion, physical deletion in progress',
    schema: {
      type: 'object',
      properties: {
        deletedCount: { type: 'number', description: 'Number of files marked for deletion' },
        totalFiles: { type: 'number', description: 'Total number of files found in folder' },
        message: { type: 'string', description: 'Success message' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - folderId is required' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async removeAllInFolder(@Query('folderId') folderId: number) {
    if (!folderId) {
      throw new BadRequestException('folderId is required');
    }

    try {
      return await this.filesService.removeAllInFolder(folderId);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Delete('folder/sync')
  @ApiOperation({ summary: 'Delete all files in folder (sync - wait for completion)' })
  @ApiQuery({ name: 'folderId', required: true, description: 'Folder ID to delete all files from' })
  @ApiResponse({ 
    status: 200, 
    description: 'All files in folder deleted successfully',
    schema: {
      type: 'object',
      properties: {
        deletedCount: { type: 'number', description: 'Number of files successfully deleted' },
        totalFiles: { type: 'number', description: 'Total number of files found in folder' },
        errors: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Array of error messages if any occurred'
        },
        message: { type: 'string', description: 'Success message' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - folderId is required' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async removeAllInFolderSync(@Query('folderId') folderId: number) {
    if (!folderId) {
      throw new BadRequestException('folderId is required');
    }

    try {
      return await this.filesService.removeAllInFolderSync(folderId);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
