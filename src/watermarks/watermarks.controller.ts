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
import { WatermarksService } from './watermarks.service';
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

@Controller('watermarks')
@ApiTags('watermarks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WatermarksController {
  constructor(private readonly watermarksService: WatermarksService) {}

  @Get()
  @ApiOperation({ summary: 'Get files list' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'folderId', required: false })
  @ApiResponse({ status: 200, description: 'Returns files list' })
  async findAll(@UserId() userId: number) {
    try {
      return await this.watermarksService.find(userId);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: fileStorage }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
    @UserId() userId: number,
  ) {
    return this.watermarksService.create(file, userId);
  }

  @Delete()
  async remove(@Query('userId') userId: number) {
    try {
      return await this.watermarksService.remove(userId);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
