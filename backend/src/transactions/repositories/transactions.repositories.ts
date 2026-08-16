import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  TxnSource,
  Transaction,
  TransactionType,
} from 'generated/prisma/client';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';

@Injectable()
export class TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateTransactionDto,
    balanceDelta: number,
  ): Promise<Transaction> {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          accountId: dto.accountId,
          categoryId: dto.categoryId,
          type: dto.type,
          amount: dto.amount,
          description: dto.description,
          occurredAt: new Date(dto.occurredAt),
          source: TxnSource.MANUAL,
        },
      });

      await tx.account.update({
        where: {
          id: dto.accountId,
        },
        data: {
          balance: {
            increment: balanceDelta,
          },
        },
      });

      return transaction;
    });
  }

  async findAllByAccount(accountId: string): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: { accountId },
      orderBy: { occurredAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.prisma.transaction.findUnique({ where: { id } });
  }

  async update(
    id: string,
    accountId: string,
    dto: UpdateTransactionDto,
    balanceDelta: number,
  ): Promise<Transaction> {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.update({
        where: {
          id,
        },
        data: {
          categoryId: dto.categoryId,
          type: dto.type,
          amount: dto.amount,
          description: dto.description,
          occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
        },
      });

      await tx.account.update({
        where: {
          id: accountId,
        },
        data: {
          balance: {
            increment: balanceDelta,
          },
        },
      });

      return transaction;
    });
  }

  async delete(id: string, accountId: string, balanceDelta: number) {
    const transaction = await this.prisma.$transaction(async (tx) => {
      const deleted = await tx.transaction.delete({ where: { id } });

      await tx.account.update({
        where: { id: accountId },
        data: {
          balance: {
            increment: balanceDelta,
          },
        },
      });
      return deleted;
    });
    return transaction;
  }

  findRecentByUser(userId: string, limit: number) {
    return this.prisma.transaction.findMany({
      where: { account: { userId } },
      orderBy: { occurredAt: 'desc' },
      take: limit,
      include: {
        account: { select: { name: true, currency: true } },
        category: { select: { name: true } },
      },
    });
  }

  // In-memory grouping over an already-fetched set of transactions, rather
  // than a DB-side groupBy — fine at this data volume, and lets the caller
  // pass in transactions already scoped/fetched across multiple accounts.
  findSummary(
    allTransactions: Transaction[],
  ): { categoryId: string | null; total: number }[] {
    const totalsByCategory = new Map<string | null, number>();

    for (const txn of allTransactions) {
      if (txn.type !== TransactionType.EXPENSE) {
        continue;
      }

      const key = txn.categoryId;
      const runningTotal = totalsByCategory.get(key) ?? 0;
      totalsByCategory.set(key, runningTotal + txn.amount.toNumber());
    }

    return Array.from(totalsByCategory.entries()).map(
      ([categoryId, total]) => ({ categoryId, total }),
    );
  }
}
