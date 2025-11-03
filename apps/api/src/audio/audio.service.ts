import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class AudioService {
  private readonly logger = new Logger(AudioService.name);
}