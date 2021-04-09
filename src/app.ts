import express, { Response as ExResponse, Request as ExRequest, NextFunction } from 'express';
import { ValidateError } from '@tsoa/runtime';
import swaggerUi from 'swagger-ui-express';
import bodyParser from 'body-parser';
import * as path from 'path';
import morgan from 'morgan';
import { RegisterRoutes } from './routes/routes';
import { Logger } from './shared/logger';
import { ApiError, ErrorHandler, OAuthError } from './shared/error-handler';
import cors from 'cors';
import multer from 'multer';
import './models/types';
import helmet from 'helmet';
import constants from './constants';
import useragent from 'express-useragent';

import './routes/controller';
import { PrivateInjectorInit } from './routes/private-injector-init';

export const app = express();

app.set('trust proxy', true);

if (constants.environment === 'debug') {
    app.use(cors());
}

if (constants.environment === 'production') {
    app.use(
        helmet({
            hsts: false
        })
    );
}

if (constants.environment === 'debug') {
    app.use(
        morgan(function (tokens, req, res) {
            return [
                tokens.method(req, res),
                tokens.url(req, res),
                tokens.status(req, res),
                tokens.res(req, res, 'content-length'),
                '-',
                tokens['response-time'](req, res),
                'ms',
                new Date().toLocaleString()
            ].join(' ');
        })
    );
}

app.use(useragent.express());

app.use(
    bodyParser.urlencoded({
        extended: true,
        limit: '55mb'
    })
);
app.use(bodyParser.json());

app.use(
    multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: 50000000 }
    }).single('file')
);

app.use('/docs', swaggerUi.serve, async (_req: ExRequest, res: ExResponse) => {
    return res.send(
        swaggerUi.generateHTML(await import(path.resolve('./build/src/swagger.json')), {
            explorer: true,
            swaggerOptions: {
                deepLinking: true,
                oauth: { clientId: 'api', usePkceWithAuthorizationCodeGrant: true }
            }
        })
    );
});

app.use('/app', express.static(path.resolve(__dirname, './../resources/public')));

RegisterRoutes(app);

app.get('/app/*', (req, res) => {
    res.sendFile(path.resolve(__dirname, './../resources/public/index.html'));
});

app.get('/', (req, res) => {
    res.redirect('/app');
});

app.use(function notFoundHandler(_req, res: ExResponse) {
    res.status(404).send({
        message: 'Not Found'
    });
});

app.use(function errorHandler(err: unknown, req: ExRequest, res: ExResponse, next: NextFunction): ExResponse | void {
    Logger.error(err);
    if (err instanceof OAuthError) {
        return res.status(err.statusCode).json({
            error: err.name,
            error_description: err?.message
        });
    }
    if (err instanceof ValidateError) {
        if (req.path === '/oauth/authorize') {
            return res.status(400).json({
                error: 'invalid_request',
                error_description: 'Invalid parameters'
            });
        } else {
            return res.status(422).json({
                message: 'Validation Failed',
                details: err?.fields
            });
        }
    }
    if (err instanceof ApiError) {
        return ErrorHandler.handleError(err, req, res, next);
    }
    return res.status(500).json(err);
});

new PrivateInjectorInit();
