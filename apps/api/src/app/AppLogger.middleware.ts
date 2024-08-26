import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AppLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');
  
  use(request: Request, response: Response, next: NextFunction) {
    const { ip, method, originalUrl: url } = request;
    const startTime = Date.now();
    
    response.on('close', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length');
      const duration = Date.now() - startTime;
      this.logger.log(
        `${method} ${url} ${statusCode} CL:${contentLength} IP:${ip} DUR:${duration}ms`
      );
    });

    next();
  }
}
