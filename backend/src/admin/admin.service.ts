import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UpdateUserDto {
  roleId?: string;
  isActive?: boolean;
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: { firstName: 'asc' },
    });
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.roleId !== undefined && { roleId: dto.roleId }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });
  }

  async getRoles() {
    return this.prisma.role.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        permissions: {
          select: {
            permission: {
              select: {
                id: true,
                keyName: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}
