import { Module, forwardRef } from '@nestjs/common';
import { DropdownsController } from './dropdowns.controller';
import { DropdownsService } from './dropdowns.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [DropdownsController],
  providers: [DropdownsService],
  exports: [DropdownsService],
  imports: [
    PrismaModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
  ],
})
export class DropdownsModule {}
