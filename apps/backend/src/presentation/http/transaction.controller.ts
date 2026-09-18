import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { TransferUseCase } from '../../application/transaction/use-cases/transfer.use-case';
import { GetTransactionsUseCase } from '../../application/transaction/use-cases/get-transactions.use-case';
import { QueryTransactionStatusUseCase } from '../../application/transaction/use-cases/query-status.use-case';
import { TransferDto, TransferSchema } from '../../application/transaction/dtos/transaction.dto';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserEntity } from '../../domain/user/entities/user.entity';

/**
 * ============================================================================
 * LEARNING NOTE: TRANSACTION CONTROLLER (DATA PRIVACY & TRANSFERS)
 * ============================================================================
 * Enforces:
 * - Intra-bank transfers & Inter-bank routing via NIBSS
 * - Strict Data Isolation: Customers can only query their own transactions.
 * - Transaction Status Check (TSQ) querying.
 */

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionController {
  constructor(
    private readonly transferUseCase: TransferUseCase,
    private readonly getTransactionsUseCase: GetTransactionsUseCase,
    private readonly queryStatusUseCase: QueryTransactionStatusUseCase,
  ) {}

  @Post('transfer')
  async transfer(
    @Body(new ZodValidationPipe(TransferSchema)) dto: TransferDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.transferUseCase.execute(dto, user);
  }

  @Get()
  async getTransactions(@CurrentUser() user: UserEntity) {
    return this.getTransactionsUseCase.execute(user);
  }

  @Get(':id')
  async getTransactionStatus(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.queryStatusUseCase.execute(id, user);
  }
}
