import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAccountDto } from '../dto/create-account.dto';
import { UpdateAccountDto } from '../dto/update-account.dto';

@Injectable()
export class AccountsRepository {
  constructor(private readonly prisma: PrismaService) {}
  async create(userId: string, dto: CreateAccountDto) {
    const account = await this.prisma.account.create({
      data: {
        name: dto.name,
        type: dto.type,
        balance: dto.balance,
        currency: dto.currency,
        userId,
      },
    });
    return account;
  }

  async findAllByUser(userId: string) {
    const acclist = await this.prisma.account.findMany({ where: { userId } });
    return acclist;
  }
  async findOneByIdAndUser(id: string, userId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id, userId },
    });

    return account;
  }

  async update(id: string, dto: UpdateAccountDto) {
    const updatedAccount = await this.prisma.account.update({
      where: { id },
      data: dto,
    });
    return updatedAccount;
  }

  async delete(id: string) {
    const deletedAccount = await this.prisma.account.delete({ where: { id } });
    return deletedAccount;
  }
}
