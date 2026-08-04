import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { DomainError } from '../../domain/shared/domain-error';

@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter<DomainError> {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      exception.statusCode >= 400 && exception.statusCode < 600
        ? exception.statusCode
        : 400;

    response.status(status).json({
      error: {
        code: exception.code,
        message: exception.message,
      },
    });
  }
}
