import { Request, Response, NextFunction } from 'express';
import { Logger } from './logger';
import constants from '../constants';
import { OAuthErrorTypes } from '../models/types';

export interface ErrorType {
    statusCode: number;
    name: string;
    message?: string;
    fields?: { [field: string]: { message: string } };
}

export class ApiError extends Error implements ErrorType {
    public statusCode = 500;
    public fields?: { [field: string]: { message: string } };

    constructor(errorType: ErrorType) {
        super(errorType.message);
        this.name = errorType.name;
        if (errorType.statusCode) this.statusCode = errorType.statusCode;
        this.fields = errorType.fields;
    }
}

export function UnknownApiError(err: any): ApiError {
    return new ApiError({ name: 'unknown_error', statusCode: 500, message: err?.message });
}

export class OAuthError extends Error implements ErrorType {
    public statusCode = 400;
    public error_description = '';
    constructor(errorType: { error_description: string; name: OAuthErrorTypes }) {
        super(errorType.error_description);
        this.name = errorType.name;
        this.error_description = errorType.error_description;
    }
}

export class ErrorHandler {
    public static handleError(error: ApiError, req: Request, res: Response, next: NextFunction): void {
        const { name, message, fields, statusCode } = error;
        Logger.error(
            `Error: ${statusCode}`,
            `Error Name: ${name}`,
            `Error Message: ${message}`,
            'Error Fields:',
            fields || {},
            'Original Error: ',
            error
        );
        res.status(statusCode).json({ name, message, fields });
        next();
    }

    private static normalizeError(error: ApiError): ApiError {
        const normalizedError: ApiError = new ApiError(error);
        Object.keys(constants.errorMap).forEach((errorKey) => {
            if (errorKey === normalizedError.name) {
                // @ts-ignore
                Object.assign(normalizedError, constants.errorMap[errorKey]);
            }
        });
        Object.keys(constants.errorTypes).forEach((errorTypeKey) => {
            // @ts-ignore
            const errorType = constants.errorTypes[errorTypeKey];
            if (errorType.statusCode === normalizedError.statusCode) normalizedError.name = errorType.name;
        });
        return normalizedError;
    }
}
