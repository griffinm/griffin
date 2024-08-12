import { Injectable } from "@nestjs/common";
import * as AWS from 'aws-sdk';
import Mutler from 'multer';
import { v4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

export interface UploadedFileProps extends AWS.S3.ManagedUpload.SendData {
  mimeType: string;
  size: number;
}

@Injectable()
export class S3Service {
  private s3: AWS.S3;
  private bucket = "griffin-media";
  private region = "us-east-1";

  constructor(
    private configService: ConfigService,
  ) {
    this.s3 = new AWS.S3({
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      region: this.region,
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<UploadedFileProps> {
    const fileKey = `${v4()}-${file.originalname}`;
    
    const params = {
      Bucket: this.bucket,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const uploadedFile = await this.s3.upload(params).promise();
    
    return {
      ...uploadedFile,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}
