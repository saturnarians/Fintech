import { PipeTransform, ArgumentMetadata, BadRequestException, Injectable } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

/**
 * ============================================================================
 * LEARNING NOTE: NESTJS CUSTOM PIPE WITH ZOD VALIDATION
 * ============================================================================
 * A NestJS Pipe intercepts incoming request payloads before they reach the controller.
 * In Clean Architecture, inbound adapters sanitize and validate external input
 * so internal domain layers only receive strictly verified data structures.
 */

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema<any>) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        throw new BadRequestException({
          message: 'Validation failed',
          errors: issues,
        });
      }
      throw new BadRequestException('Validation failed');
    }
  }
}
