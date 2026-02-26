import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { createReadStream, createWriteStream } from 'fs';
import { unlink, stat } from 'fs/promises';
import { createGzip } from 'zlib';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { pipeline } from 'stream/promises';

@Controller('uploads')
export class UploadsController {
  @Post()
  @ApiOperation({ summary: 'Upload a file and store it gzip-compressed' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded and compressed successfully' })
  @ApiResponse({ status: 400, description: 'No file provided' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './data',
        filename: (_req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const srcPath = file.path;
    const gzPath = srcPath + '.gz';

    await pipeline(
      createReadStream(srcPath),
      createGzip(),
      createWriteStream(gzPath),
    );

    await unlink(srcPath);

    const { size: compressedSize } = await stat(gzPath);

    return {
      originalName: file.originalname,
      filename: file.filename + '.gz',
      originalSize: file.size,
      compressedSize,
      mimetype: file.mimetype,
    };
  }
}
