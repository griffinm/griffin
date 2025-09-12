import { Injectable } from "@nestjs/common";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

export interface UploadedFileProps {
  Location: string;
  ETag: string;
  Bucket: string;
  Key: string;
  mimeType: string;
  size: number;
}

interface FileUpload {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucket = "griffin-media";
  private region = "us-east-1";

  constructor(
    private configService: ConfigService,
  ) {
    this.s3Client = new S3Client({
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
      region: this.region,
    });
  }

  async uploadFile(file: FileUpload): Promise<UploadedFileProps> {
    const fileKey = `${v4()}-${file.originalname}`;
    
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    const response = await this.s3Client.send(command);
    
    return {
      Location: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${fileKey}`,
      ETag: response.ETag || '',
      Bucket: this.bucket,
      Key: fileKey,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}
