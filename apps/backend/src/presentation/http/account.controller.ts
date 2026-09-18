import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { CreateAccountUseCase } from '../../application/account/use-cases/create-account.use-case';
import { GetAccountUseCase } from '../../application/account/use-cases/get-account.use-case';
import { NameEnquiryUseCase } from '../../application/account/use-cases/name-enquiry.use-case';
import { CreateAccountDto, CreateAccountSchema } from '../../application/account/dtos/account.dto';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserEntity } from '../../domain/user/entities/user.entity';

/**
 * ============================================================================
 * LEARNING NOTE: ACCOUNT CONTROLLER (DRIVING ADAPTER)
 * ============================================================================
 * Exposes core account creation and enquiry endpoints.
 * Demonstrates:
 * - RBAC: Admin can list all accounts; Customers can only view their own account.
 * - Single Account enforcement.
 * - Automatic pre-funding with ₦15,000.
 */

@Controller('accounts')
export class AccountController {
  constructor(
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly getAccountUseCase: GetAccountUseCase,
    private readonly nameEnquiryUseCase: NameEnquiryUseCase,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createAccount(
    @Body(new ZodValidationPipe(CreateAccountSchema)) dto: CreateAccountDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.createAccountUseCase.execute(dto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyAccount(@CurrentUser() user: UserEntity) {
    return this.getAccountUseCase.getMyAccount(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('balance')
  async getMyBalance(@CurrentUser() user: UserEntity) {
    return this.getAccountUseCase.getBalance(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('name-enquiry/:accountNumber')
  async nameEnquiry(@Param('accountNumber') accountNumber: string) {
    return this.nameEnquiryUseCase.execute(accountNumber);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  async getAllAccounts() {
    return this.getAccountUseCase.getAllAccounts();
  }
}
