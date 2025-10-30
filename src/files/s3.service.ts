import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface S3PutParams {
  key: string;
  contentType: string;
  body: Buffer | Uint8Array | Blob | string | ReadableStream<any>;
}

@Injectable()
export class S3StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly cdnBaseUrl?: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('S3_BUCKET');
    const endpoint = this.config.get<string>('S3_ENDPOINT');
    const region = this.config.get<string>('S3_REGION');
    const accessKeyId = this.config.get<string>('S3_ACCESS_KEY');
    const secretAccessKey = this.config.get<string>('S3_SECRET_KEY');
    this.cdnBaseUrl = this.config.get<string>('S3_CDN_URL');

    this.client = new S3Client({
      region,
      endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async upload(params: S3PutParams): Promise<{ key: string; url: string }>
  {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      ACL: 'private',
    });
    await this.client.send(command);

    const url = this.cdnBaseUrl
      ? `${this.cdnBaseUrl.replace(/\/$/, '')}/${encodeURI(params.key)}`
      : `${this.config.get<string>('S3_ENDPOINT')!.replace(/\/$/, '')}/${this.bucket}/${encodeURI(params.key)}`;

    return { key: params.key, url };
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({ Bucket: this.bucket, Key: key });
    await this.client.send(command);
  }

  async getPresignedPutUrl(key: string, contentType: string, expiresInSeconds = 900): Promise<string> {
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType, ACL: 'private' });
    return await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }
}


