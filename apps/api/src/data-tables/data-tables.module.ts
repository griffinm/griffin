import { Module, forwardRef } from '@nestjs/common';
import { DataTablesController } from './data-tables.controller';
import { DataTablesService } from './data-tables.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [DataTablesController],
  providers: [DataTablesService],
  exports: [DataTablesService],
  imports: [
    PrismaModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
  ],
})
export class DataTablesModule {}
