import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateDto } from './dto/update.dto';
import * as bcrypt from 'bcrypt';
import { UserEntity } from './dto/user.entity';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getById(id: string): Promise<UserEntity> {
    const user = await this.prisma.user.findFirst({ where: { id } });
    return new UserEntity(user);
  }

  async getByEmail(email: string): Promise<UserEntity> {
    return await this.prisma.user.findFirst({ where: { email } });
  }

  async updateUser(id: string, updateDto: UpdateDto): Promise<UserEntity> {
    const hashedPassword = await bcrypt.hash(updateDto.password, 10);

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...updateDto,
        password: hashedPassword
      }
    });

    return new UserEntity(user);
  }
}
