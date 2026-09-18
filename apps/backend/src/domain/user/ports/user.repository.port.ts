import { UserEntity } from '../entities/user.entity';

/**
 * ============================================================================
 * LEARNING NOTE: DRIVEN / OUTBOUND PORT (USER REPOSITORY PORT)
 * ============================================================================
 * In Hexagonal Architecture, a "Port" is an interface defined by the domain.
 * The domain specifies what persistence capabilities it needs, without knowing
 * whether it's SQLite, PostgreSQL, or an in-memory test double.
 */

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByBvnOrNin(identifier: string): Promise<UserEntity | null>;
  save(user: UserEntity): Promise<UserEntity>;
  findAll(): Promise<UserEntity[]>;
}

export const USER_REPOSITORY_TOKEN = Symbol('IUserRepository');
