import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountsRepository } from './repositories/accounts.repository';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly accountRepositoy: AccountsRepository) {}

  async create(userId: string, dto: CreateAccountDto) {
    const account = await this.accountRepositoy.create(userId, dto);
    return account;
  }

  async getOne(id: string, userId: string) {
    const account = await this.accountRepositoy.findOneByIdAndUser(id, userId);
    if (!account) {
      throw new NotFoundException("Account doesn't exist");
    }

    return account;
  }

  async getAll(userId: string) {
    const acclist = await this.accountRepositoy.findAllByUser(userId);
    return acclist;
  }

  async update(id: string, userId: string, dto: UpdateAccountDto) {
    await this.getOne(id, userId);
    const updatedAccount = await this.accountRepositoy.update(id, dto);
    return updatedAccount;
  }

  async delete(id: string, userId: string) {
    await this.getOne(id, userId);
    const deletedAccount = await this.accountRepositoy.delete(id);
    return deletedAccount;
  }
}
