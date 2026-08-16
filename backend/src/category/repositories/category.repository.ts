import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}
  async create(userId: string, dto: CreateCategoryDto) {
    const category = await this.prisma.category.create({
      data: {
        userId,
        name: dto.name,
        parentId: dto.parentId,
      },
    });
    return category;
  }

  async findAllByUser(userId: string) {
    const categories = await this.prisma.category.findMany({
      where: { userId },
    });
    return categories;
  }

  async findOneByIdAndUser(id: string, userId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.update({
      where: { id },
      data: dto,
    });
    return category;
  }

  async delete(id: string) {
    const category = await this.prisma.category.delete({ where: { id } });
    return category;
  }

  async countChildren(parentId: string) {
    return await this.prisma.category.count({
      where: { parentId },
    });
  }
}
