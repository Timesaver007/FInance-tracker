import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.interface';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  async create(
    @Body() dto: CreateTransactionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.transactionsService.create(user.sub, dto);
  }

  @Get()
  async findAllForAccount(
    @Query('accountId', ParseUUIDPipe) accountId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.transactionsService.findAllForAccount(accountId, user.sub);
  }

  @Get('/summary/by-category')
  async findChartSummary(@CurrentUser() user: JwtPayload) {
    return this.transactionsService.findSummary(user.sub);
  }

  @Get('/recent')
  async findRecent(
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.transactionsService.findRecentTransactions(user.sub, limit);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.transactionsService.findOne(id, user.sub);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(id, user.sub, dto);
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.transactionsService.delete(id, user.sub);
  }
}
