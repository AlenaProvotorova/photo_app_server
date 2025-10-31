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
    this.bucket = (this.config.get<string>('S3_BUCKET') || '').trim();
    const endpointRaw = (this.config.get<string>('S3_ENDPOINT') || '').trim();
    const regionRaw = (this.config.get<string>('S3_REGION') || '').trim();
    const accessKeyId = (this.config.get<string>('S3_ACCESS_KEY') || '').trim();
    const secretAccessKey = (this.config.get<string>('S3_SECRET_KEY') || '').trim();
    this.cdnBaseUrl = (this.config.get<string>('S3_CDN_URL') || '').trim();

    const endpoint = endpointRaw || `https://s3.${regionRaw}.storage.selcloud.ru`;
    const region = regionRaw || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ru-1';

    try {
      new URL(endpoint);
    } catch (e) {
      throw e;
    }


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
      ACL: (this.config.get<string>('S3_OBJECT_ACL') || 'public-read') as any,
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


