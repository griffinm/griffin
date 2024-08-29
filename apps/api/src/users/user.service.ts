import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateDto } from './dto/update.dto';
import * as bcrypt from 'bcrypt';
import { UserEntity } from './dto/user.entity';
import { CreateDto } from './dto/create.dto';
import { BadRequestException } from '@nestjs/common';
import { User } from '@prisma/client';

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

  async createUser(createDto: CreateDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createDto.password, 10);
    const userExists = await this.checkIfUserExists(createDto.email);
    if (userExists) {
      throw new BadRequestException('User already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        ...createDto,
        password: hashedPassword
      }
    });

    // Create default notebook
    await this.prisma.notebook.create({
      data: {
        title: 'General',
        userId: user.id,
        isDefault: true
      }
    });

    return user;
  }

  async updateUser(id: string, updateDto: UpdateDto): Promise<UserEntity> {
    const hashedPassword = await bcrypt.hash(updateDto.password, 10);
    const userExists = await this.checkIfUserExists(updateDto.email, id);
    if (userExists) {
      throw new BadRequestException('User already exists');
    }

    return await this.prisma.user.update({
      where: { id },
      data: {
        ...updateDto,
        password: hashedPassword
      }
    });
  }

  private async checkIfUserExists(email: string, id?: string): Promise<boolean> {
    let user: UserEntity | null;
    if (id) {
      user = await this.prisma.user.findFirst(
        { 
          where: { email, id: { not: id } },
        }
      );
    } else {
      user = await this.prisma.user.findFirst({ where: { email } });
    }
    return user !== null;
  }
}
