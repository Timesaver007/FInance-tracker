import { Injectable, NotFoundException } from '@nestjs/common';
import { TransactionsRepository } from './repositories/transactions.repositories';
import { AccountsService } from '../accounts/accounts.service';
import { CategoryService } from '../category/category.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionType, Transaction } from 'generated/prisma/client';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly accountsService: AccountsService,
    private readonly categoryService: CategoryService,
  ) {}

  // TRANSFER is treated the same as EXPENSE (money leaving this account).
  // The schema records one Transaction row per account with no "to account"
  // field, so there's no way to distinguish an incoming vs outgoing transfer
  // leg beyond type/amount alone — this is a deliberate simplification.
  private computeBalanceDelta(type: TransactionType, amount: number): number {
    return type === TransactionType.INCOME ? amount : -amount;
  }

  async create(userId: string, dto: CreateTransactionDto) {
    await this.accountsService.getOne(dto.accountId, userId);

    if (dto.categoryId) {
      await this.categoryService.findCategoryById(dto.categoryId, userId);
    }

    const balanceDelta = this.computeBalanceDelta(dto.type, dto.amount);
    return this.transactionsRepository.create(dto, balanceDelta);
  }

  async findAllForAccount(accountId: string, userId: string) {
    await this.accountsService.getOne(accountId, userId);
    return this.transactionsRepository.findAllByAccount(accountId);
  }

  findRecentTransactions(userId: string, limit: number) {
    return this.transactionsRepository.findRecentByUser(userId, limit);
  }

  async findOne(id: string, userId: string) {
    const transaction = await this.transactionsRepository.findById(id);
    if (!transaction) {
      throw new NotFoundException("Transaction doesn't exist");
    }

    // Transaction has no userId of its own — ownership is only provable by
    // resolving the account it belongs to and checking that against the
    // caller. getOne() throws NotFoundException if it isn't theirs, which
    // also correctly hides "exists but not yours" behind the same 404.
    await this.accountsService.getOne(transaction.accountId, userId);

    return transaction;
  }

  async update(id: string, userId: string, dto: UpdateTransactionDto) {
    const existing = await this.findOne(id, userId);

    if (dto.categoryId) {
      await this.categoryService.findCategoryById(dto.categoryId, userId);
    }

    // balance is a maintained running total, not recomputed from scratch, so
    // the row's *old* effect is already baked into it — applying newDelta
    // alone would double-count. correctedBalance = (balance - oldDelta) +
    // newDelta = balance + (newDelta - oldDelta), so a single netDelta both
    // reverses the old effect and applies the new one in one increment.
    const oldDelta = this.computeBalanceDelta(
      existing.type,
      existing.amount.toNumber(),
    );
    const newType = dto.type ?? existing.type;
    const newAmount = dto.amount ?? existing.amount.toNumber();
    const newDelta = this.computeBalanceDelta(newType, newAmount);
    const netDelta = newDelta - oldDelta;

    return this.transactionsRepository.update(
      id,
      existing.accountId,
      dto,
      netDelta,
    );
  }

  async delete(id: string, userId: string) {
    const existing = await this.findOne(id, userId);

    const reversalDelta = -this.computeBalanceDelta(
      existing.type,
      existing.amount.toNumber(),
    );

    return this.transactionsRepository.delete(
      id,
      existing.accountId,
      reversalDelta,
    );
  }

  async findSummary(userId: string) {
    const accounts = await this.accountsService.getAll(userId);

    let allTransactions: Transaction[] = [];
    for (const account of accounts) {
      const accountTransactions = await this.findAllForAccount(
        account.id,
        userId,
      );
      allTransactions = allTransactions.concat(accountTransactions);
    }

    const summary = this.transactionsRepository.findSummary(allTransactions);

    // The repository only knows raw categoryIds — a chart needs names, not
    // UUIDs, so resolve them here rather than have the repository reach
    // into another model's table.
    const categories = await this.categoryService.findCategories(userId);
    const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

    return summary.map(({ categoryId, total }) => ({
      categoryId,
      categoryName: categoryId
        ? (categoryNameById.get(categoryId) ?? 'Unknown category')
        : 'Uncategorized',
      total,
    }));
  }
}
