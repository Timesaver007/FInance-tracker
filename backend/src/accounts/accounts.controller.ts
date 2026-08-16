import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.interface';
import { UpdateAccountDto } from './dto/update-account.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountService: AccountsService) {}

  @Post()
  async createAccount(
    @Body() dto: CreateAccountDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.accountService.create(user.sub, dto);
  }

  @Get()
  async getAccount(@CurrentUser() user: JwtPayload) {
    return this.accountService.getAll(user.sub);
  }

  @Get(':id')
  async getAccountById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.accountService.getOne(id, user.sub);
  }

  @Patch(':id')
  async updateAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountService.update(id, user.sub, dto);
  }

  @Delete(':id')
  async deleteAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.accountService.delete(id, user.sub);
  }
}
