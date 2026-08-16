import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CategoryRepository } from './repositories/category.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryrepo: CategoryRepository) {}

  private async validateParentExists(
    parentId: string,
    userId: string,
  ): Promise<void> {
    const parent = await this.categoryrepo.findOneByIdAndUser(parentId, userId);
    if (!parent) {
      throw new NotFoundException('Parent category not found');
    }
  }

  async create(userId: string, dto: CreateCategoryDto) {
    if (dto.parentId) {
      await this.validateParentExists(dto.parentId, userId);
    }
    return this.categoryrepo.create(userId, dto);
  }

  async findCategories(userId: string) {
    return this.categoryrepo.findAllByUser(userId);
  }

  async findCategoryById(id: string, userId: string) {
    const category = await this.categoryrepo.findOneByIdAndUser(id, userId);
    if (!category) {
      throw new NotFoundException("Category doesn't exist");
    }
    return category;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto, userId: string) {
    await this.findCategoryById(id, userId);

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('A category cannot be its own parent');
      }
      await this.validateParentExists(dto.parentId, userId);
    }

    return this.categoryrepo.update(id, dto);
  }

  async deleteCategory(id: string, userId: string) {
    await this.findCategoryById(id, userId);

    const childCount = await this.categoryrepo.countChildren(id);
    if (childCount > 0) {
      throw new ConflictException("Can't delete a category that has children");
    }

    return this.categoryrepo.delete(id);
  }
}
