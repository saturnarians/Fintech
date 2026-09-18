import * as bcrypt from 'bcryptjs';
import { Injectable } from '@nestjs/common';

/**
 * ============================================================================
 * LEARNING NOTE: SECURITY & PASSWORD HASHING
 * ============================================================================
 * Uses bcrypt with salt rounds = 10 to securely hash passwords before storing.
 * Never store plaintext passwords in a financial system.
 */

@Injectable()
export class PasswordHasher {
  private readonly saltRounds = 10;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
