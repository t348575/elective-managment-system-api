/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { Controller, ValidationService, FieldErrors, ValidateError, TsoaRoute, HttpStatusCodeLiteral, TsoaResponse } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ElectivesController } from './electives/controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AuthController } from './oauth/controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { UsersController } from './user/controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { NotificationController } from './notification/controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { DownloadController } from './download/controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ClassController } from './classes/controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { FormsController } from './forms/controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ResponseController } from './response/controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { QuizzesController } from './quizzes/controller';
import { expressAuthentication } from './../shared/authentication-module';
import { iocContainer } from './../ioc';
import { IocContainer, IocContainerFactory } from '@tsoa/runtime';
import * as express from 'express';

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "ErrorType": {
        "dataType": "refObject",
        "properties": {
            "statusCode": {"dataType":"double","required":true},
            "name": {"dataType":"string","required":true},
            "message": {"dataType":"string"},
            "fields": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Failed": {
        "dataType": "refObject",
        "properties": {
            "item": {"dataType":"any","required":true},
            "reason": {"dataType":"string","required":true},
            "error": {"ref":"ErrorType"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DefaultActionResponse": {
        "dataType": "refObject",
        "properties": {
            "status": {"dataType":"boolean","required":true},
            "failed": {"dataType":"array","array":{"ref":"Failed"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "electiveAttributes": {
        "dataType": "refAlias",
        "type": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"string","required":true},"key":{"dataType":"string","required":true}}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AddElectives": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"string","required":true},
            "courseCode": {"dataType":"string","required":true},
            "version": {"dataType":"double","required":true},
            "strength": {"dataType":"double","required":true},
            "attributes": {"ref":"electiveAttributes","required":true},
            "batches": {"dataType":"array","array":{"dataType":"string"},"required":true,"validators":{"pattern":{"value":"^\\d{4}-\\d-[a-zA-Z]{4,5}-[a-zA-Z]{3,4}$"}}},
            "teachers": {"dataType":"array","array":{"dataType":"string"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IBatchModel": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string"},
            "year": {"dataType":"double","required":true},
            "numYears": {"dataType":"double","required":true},
            "degree": {"dataType":"string","required":true},
            "course": {"dataType":"string","required":true},
            "batchString": {"dataType":"string","required":true,"validators":{"pattern":{"value":"^\\d{4}-\\d-[a-zA-Z]{4,5}-[a-zA-Z]{3,4}$"}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "scopes": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["teacher"]},{"dataType":"enum","enums":["admin"]},{"dataType":"enum","enums":["student"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IElectiveModel": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string"},
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"string","required":true},
            "courseCode": {"dataType":"string","required":true},
            "version": {"dataType":"double","required":true},
            "strength": {"dataType":"double","required":true},
            "attributes": {"ref":"electiveAttributes","required":true},
            "batches": {"dataType":"array","array":{"ref":"IBatchModel"},"required":true},
            "teachers": {"dataType":"array","array":{"ref":"IUserModel"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IUserModel": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string"},
            "name": {"dataType":"string","required":true},
            "username": {"dataType":"string","required":true},
            "password": {"dataType":"string","required":true},
            "rollNo": {"dataType":"string","required":true},
            "role": {"ref":"scopes","required":true},
            "batch": {"ref":"IBatchModel"},
            "classes": {"dataType":"array","array":{"ref":"IClassModel"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IClassModel": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string"},
            "batches": {"dataType":"array","array":{"ref":"IBatchModel"},"required":true},
            "elective": {"ref":"IElectiveModel","required":true},
            "students": {"dataType":"array","array":{"ref":"IUserModel"},"required":true},
            "teacher": {"ref":"IUserModel","required":true},
            "files": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"createdAt":{"dataType":"datetime","required":true},"file":{"ref":"IDownloadModel","required":true}}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IDownloadModel": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string"},
            "path": {"dataType":"string","required":true},
            "shouldTrack": {"dataType":"boolean","required":true},
            "fileId": {"dataType":"string","required":true},
            "deleteOnAccess": {"dataType":"boolean","required":true},
            "limitedBy": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["user"]},{"dataType":"enum","enums":["class"]},{"dataType":"enum","enums":["none"]}],"required":true},
            "limitedTo": {"dataType":"array","array":{"ref":"IUserModel"},"required":true},
            "limitedToClass": {"ref":"IClassModel","required":true},
            "name": {"dataType":"string","required":true},
            "trackAccess": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"time":{"dataType":"datetime","required":true},"user":{"ref":"IUserModel","required":true}}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PaginationModel_IElectiveModel_": {
        "dataType": "refObject",
        "properties": {
            "count": {"dataType":"double","required":true},
            "page": {"dataType":"double","required":true},
            "limit": {"dataType":"double","required":true},
            "totalPages": {"dataType":"double","required":true},
            "docs": {"dataType":"array","array":{"ref":"IElectiveModel"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateElectiveOptions": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string"},
            "description": {"dataType":"string"},
            "courseCode": {"dataType":"string"},
            "version": {"dataType":"double"},
            "strength": {"dataType":"double"},
            "attributes": {"ref":"electiveAttributes"},
            "batches": {"dataType":"array","array":{"dataType":"string"},"validators":{"pattern":{"value":"^\\d{4}-\\d-[a-zA-Z]{4,5}-[a-zA-Z]{3,4}$"}}},
            "teachers": {"dataType":"array","array":{"dataType":"string"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "responseTypes": {
        "dataType": "refAlias",
        "type": {"dataType":"enum","enums":["code"],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "clientIds": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["api"]},{"dataType":"enum","enums":["site"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "acceptedChallengeMethods": {
        "dataType": "refAlias",
        "type": {"dataType":"enum","enums":["S256"],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "tokenResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"refresh_token":{"dataType":"string","required":true},"access_token":{"dataType":"string","required":true},"id_token":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "tokenBodyType": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"code_verifier":{"dataType":"string","required":true},"code":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "refreshTokenResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"access_token":{"dataType":"string","required":true},"refresh_token":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "refreshToken": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"refresh_token":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SafeUser": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "username": {"dataType":"string","required":true},
            "role": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["admin"]},{"dataType":"enum","enums":["teacher"]},{"dataType":"enum","enums":["student"]}],"required":true},
            "rollNo": {"dataType":"string","required":true},
            "batch": {"ref":"IBatchModel"},
            "classes": {"dataType":"array","array":{"ref":"IClassModel"}},
            "id": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateUser": {
        "dataType": "refObject",
        "properties": {
            "users": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"batch":{"dataType":"string"},"role":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["admin"]},{"dataType":"enum","enums":["teacher"]},{"dataType":"enum","enums":["student"]}],"required":true},"rollNo":{"dataType":"string","required":true},"username":{"dataType":"string"},"name":{"dataType":"string","required":true}}},"required":true},
            "defaultRollNoAsEmail": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateUserCSV": {
        "dataType": "refObject",
        "properties": {
            "defaultRollNoAsEmail": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateUser": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string"},
            "password": {"dataType":"string"},
            "rollNo": {"dataType":"string","required":true},
            "batch": {"dataType":"string","validators":{"pattern":{"value":"^\\d{4}-\\d-[a-zA-Z]{4,5}-[a-zA-Z]{3,4}$"}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DefaultResponse": {
        "dataType": "refObject",
        "properties": {
            "status": {"dataType":"boolean","required":true},
            "message": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdatePasswordRequest": {
        "dataType": "refObject",
        "properties": {
            "oldPassword": {"dataType":"string","required":true},
            "newPassword": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResetPasswordRequest": {
        "dataType": "refObject",
        "properties": {
            "password": {"dataType":"string","required":true},
            "code": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ITrackModel": {
        "dataType": "refObject",
        "properties": {
            "device": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["desktop"]},{"dataType":"enum","enums":["mobile"]},{"dataType":"enum","enums":["bot"]},{"dataType":"enum","enums":["unknown"]}],"required":true},
            "browser": {"dataType":"string","required":true},
            "platform": {"dataType":"string","required":true},
            "user": {"ref":"IUserModel","required":true},
            "ip": {"dataType":"string","required":true},
            "id": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PaginationModel_ITrackModel_": {
        "dataType": "refObject",
        "properties": {
            "count": {"dataType":"double","required":true},
            "page": {"dataType":"double","required":true},
            "limit": {"dataType":"double","required":true},
            "totalPages": {"dataType":"double","required":true},
            "docs": {"dataType":"array","array":{"ref":"ITrackModel"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "INotificationModel": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string"},
            "user": {"ref":"IUserModel","required":true},
            "device": {"dataType":"string","required":true},
            "sub": {"dataType":"nestedObjectLiteral","nestedProperties":{"keys":{"dataType":"nestedObjectLiteral","nestedProperties":{"auth":{"dataType":"string","required":true},"p256dh":{"dataType":"string","required":true}},"required":true},"expirationTime":{"dataType":"enum","enums":[null],"required":true},"endpoint":{"dataType":"string","required":true}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SubscribeOptions": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "sub": {"dataType":"nestedObjectLiteral","nestedProperties":{"keys":{"dataType":"nestedObjectLiteral","nestedProperties":{"auth":{"dataType":"string","required":true},"p256dh":{"dataType":"string","required":true}},"required":true},"expirationTime":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":[null]},{"dataType":"double"}],"required":true},"endpoint":{"dataType":"string","required":true}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UnSubscribeOptions": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CustomNotifyOptions": {
        "dataType": "refObject",
        "properties": {
            "batches": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "users": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "role": {"ref":"scopes"},
            "notifyAll": {"dataType":"boolean","required":true},
            "title": {"dataType":"string","required":true},
            "body": {"dataType":"string","required":true},
            "replaceItems": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AddClassResourceOptions": {
        "dataType": "refObject",
        "properties": {
            "classId": {"dataType":"string","required":true},
            "shouldTrack": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PaginationModel_IClassModel_": {
        "dataType": "refObject",
        "properties": {
            "count": {"dataType":"double","required":true},
            "page": {"dataType":"double","required":true},
            "limit": {"dataType":"double","required":true},
            "totalPages": {"dataType":"double","required":true},
            "docs": {"dataType":"array","array":{"ref":"IClassModel"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ClassFormatter": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "_id": {"dataType":"string","required":true},
            "batches": {"dataType":"array","array":{"ref":"IBatchModel"},"required":true},
            "elective": {"ref":"IElectiveModel","required":true},
            "students": {"dataType":"array","array":{"ref":"IUserModel"},"required":true},
            "teacher": {"ref":"IUserModel","required":true},
            "files": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"createdAt":{"dataType":"datetime","required":true},"file":{"ref":"IDownloadModel","required":true}}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserFormatter": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "_id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "username": {"dataType":"string","required":true},
            "password": {"dataType":"string","required":true},
            "rollNo": {"dataType":"string","required":true},
            "role": {"ref":"scopes","required":true},
            "batch": {"ref":"IBatchModel"},
            "classes": {"dataType":"array","array":{"ref":"IClassModel"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IRequestChangeModel": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string"},
            "from": {"ref":"IElectiveModel","required":true},
            "to": {"ref":"IElectiveModel","required":true},
            "user": {"ref":"IUserModel","required":true},
            "requestDate": {"dataType":"datetime","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RequestElectiveChangeOptions": {
        "dataType": "refObject",
        "properties": {
            "from": {"dataType":"string","required":true},
            "to": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RequestChangeFormatter": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "_id": {"dataType":"string","required":true},
            "from": {"ref":"IElectiveModel","required":true},
            "to": {"ref":"IElectiveModel","required":true},
            "user": {"ref":"IUserModel","required":true},
            "requestDate": {"dataType":"datetime","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ExplicitElectives": {
        "dataType": "refObject",
        "properties": {
            "user": {"ref":"IUserModel","required":true},
            "electives": {"dataType":"array","array":{"ref":"IElectiveModel"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IFormModel": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string"},
            "start": {"dataType":"datetime","required":true},
            "end": {"dataType":"datetime","required":true},
            "shouldSelect": {"dataType":"double","required":true},
            "selectAllAtForm": {"dataType":"boolean","required":true},
            "electives": {"dataType":"array","array":{"ref":"IElectiveModel"},"required":true},
            "active": {"dataType":"boolean","required":true},
            "show": {"dataType":"boolean","required":true},
            "explicit": {"dataType":"array","array":{"ref":"ExplicitElectives"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateFormOptions": {
        "dataType": "refObject",
        "properties": {
            "start": {"dataType":"string","required":true},
            "end": {"dataType":"string","required":true},
            "numElectives": {"dataType":"double","required":true},
            "shouldSelectAll": {"dataType":"boolean","required":true},
            "electives": {"dataType":"array","array":{"dataType":"string"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PaginationModel_any_": {
        "dataType": "refObject",
        "properties": {
            "count": {"dataType":"double","required":true},
            "page": {"dataType":"double","required":true},
            "limit": {"dataType":"double","required":true},
            "totalPages": {"dataType":"double","required":true},
            "docs": {"dataType":"array","array":{"dataType":"any"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GenerateListResponse": {
        "dataType": "refObject",
        "properties": {
            "status": {"dataType":"boolean","required":true},
            "downloadUri": {"dataType":"string","required":true},
            "failed": {"dataType":"array","array":{"ref":"Failed"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateFormOptions": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "start": {"dataType":"string"},
            "end": {"dataType":"string"},
            "shouldSelect": {"dataType":"double"},
            "selectAllAtForm": {"dataType":"boolean"},
            "electives": {"dataType":"array","array":{"dataType":"string"}},
            "active": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AddExplicitOptions": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "options": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"electives":{"dataType":"array","array":{"dataType":"string"},"required":true},"user":{"dataType":"string","required":true}}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IResponseModel": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string"},
            "user": {"ref":"IUserModel","required":true},
            "responses": {"dataType":"array","array":{"ref":"IElectiveModel"},"required":true},
            "form": {"ref":"IFormModel","required":true},
            "time": {"dataType":"datetime","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FormResponseOptions": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "electives": {"dataType":"array","array":{"dataType":"string"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateQuizOptions": {
        "dataType": "refObject",
        "properties": {
            "password": {"dataType":"string"},
            "classItem": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "start": {"dataType":"string","required":true},
            "end": {"dataType":"string","required":true},
            "time": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IQuestionModel": {
        "dataType": "refObject",
        "properties": {
            "points": {"dataType":"double","required":true},
            "negativePoints": {"dataType":"double","required":true},
            "name": {"dataType":"string","required":true},
            "options": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "answer": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IQuizModel": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string"},
            "classItem": {"ref":"IClassModel","required":true},
            "name": {"dataType":"string","required":true},
            "start": {"dataType":"datetime","required":true},
            "end": {"dataType":"datetime","required":true},
            "time": {"dataType":"double","required":true},
            "password": {"dataType":"string"},
            "questions": {"dataType":"array","array":{"ref":"IQuestionModel"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IQuizResponseModel": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string"},
            "user": {"ref":"IUserModel","required":true},
            "quiz": {"ref":"IQuizModel","required":true},
            "classItem": {"ref":"IClassModel","required":true},
            "answers": {"dataType":"array","array":{"dataType":"double"},"required":true},
            "start": {"dataType":"datetime","required":true},
            "end": {"dataType":"datetime"},
            "score": {"dataType":"double","required":true},
            "published": {"dataType":"boolean","required":true},
            "attended": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PaginationModel_IQuizResponseModel_": {
        "dataType": "refObject",
        "properties": {
            "count": {"dataType":"double","required":true},
            "page": {"dataType":"double","required":true},
            "limit": {"dataType":"double","required":true},
            "totalPages": {"dataType":"double","required":true},
            "docs": {"dataType":"array","array":{"ref":"IQuizResponseModel"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "StartQuizOptions": {
        "dataType": "refObject",
        "properties": {
            "password": {"dataType":"string"},
            "quizId": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateQuizOptions": {
        "dataType": "refObject",
        "properties": {
            "quizId": {"dataType":"string","required":true},
            "password": {"dataType":"string"},
            "start": {"dataType":"string"},
            "end": {"dataType":"string"},
            "name": {"dataType":"string"},
            "time": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const validationService = new ValidationService(models);

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

export function RegisterRoutes(app: express.Router) {
    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################
        app.post('/electives/add',
            authenticateMiddleware([{"jwt":["admin"]}]),
            function ElectivesController_addElectives(request: any, response: any, next: any) {
            const args = {
                    options: {"in":"body","name":"options","required":true,"dataType":"array","array":{"ref":"AddElectives"}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<ElectivesController>(ElectivesController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.addElectives.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/electives/add-csv',
            authenticateMiddleware([{"jwt":["admin"]}]),
            function ElectivesController_addElectivesCSV(request: any, response: any, next: any) {
            const args = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<ElectivesController>(ElectivesController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.addElectivesCSV.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/electives',
            authenticateMiddleware([{"jwt":["teacher","admin","student"]}]),
            function ElectivesController_getElectives(request: any, response: any, next: any) {
            const args = {
                    pageNumber: {"in":"query","name":"pageNumber","required":true,"dataType":"double"},
                    limit: {"in":"query","name":"limit","required":true,"dataType":"double"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    fields: {"in":"query","name":"fields","dataType":"string"},
                    sortBy: {"in":"query","name":"sortBy","dataType":"string"},
                    courseCode: {"in":"query","name":"courseCode","dataType":"string"},
                    name: {"in":"query","name":"name","dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<ElectivesController>(ElectivesController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.getElectives.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/electives',
            authenticateMiddleware([{"jwt":["admin","teacher"]}]),
            function ElectivesController_updateElective(request: any, response: any, next: any) {
            const args = {
                    options: {"in":"body","name":"options","required":true,"ref":"UpdateElectiveOptions"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<ElectivesController>(ElectivesController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.updateElective.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.delete('/electives',
            authenticateMiddleware([{"jwt":["admin"]}]),
            function ElectivesController_deleteElective(request: any, response: any, next: any) {
            const args = {
                    id: {"in":"query","name":"id","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<ElectivesController>(ElectivesController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.deleteElective.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/oauth/authorize',
            function AuthController_auth(request: any, response: any, next: any) {
            const args = {
                    responseType: {"in":"query","name":"response_type","required":true,"ref":"responseTypes"},
                    clientId: {"in":"query","name":"client_id","required":true,"ref":"clientIds"},
                    redirectUri: {"in":"query","name":"redirect_uri","required":true,"dataType":"string"},
                    scope: {"in":"query","name":"scope","required":true,"ref":"scopes"},
                    state: {"in":"query","name":"state","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    username: {"in":"query","name":"username","required":true,"dataType":"string"},
                    password: {"in":"query","name":"password","required":true,"dataType":"string"},
                    codeChallenge: {"in":"query","name":"code_challenge","required":true,"dataType":"string"},
                    codeChallengeMethod: {"in":"query","name":"code_challenge_method","required":true,"ref":"acceptedChallengeMethods"},
                    idToken: {"in":"query","name":"id_token","dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<AuthController>(AuthController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.auth.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/oauth/login',
            function AuthController_login(request: any, response: any, next: any) {
            const args = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<AuthController>(AuthController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.login.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/oauth/token',
            function AuthController_token(request: any, response: any, next: any) {
            const args = {
                    body: {"in":"body","name":"body","required":true,"ref":"tokenBodyType"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<AuthController>(AuthController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.token.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/oauth/refresh',
            authenticateMiddleware([{"jwtRefresh":["teacher","admin","student"]}]),
            function AuthController_refresh(request: any, response: any, next: any) {
            const args = {
                    body: {"in":"body","name":"body","required":true,"ref":"refreshToken"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<AuthController>(AuthController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.refresh.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/oauth/logout',
            authenticateMiddleware([{"userId":["teacher","admin","student"]}]),
            function AuthController_logout(request: any, response: any, next: any) {
            const args = {
                    refresh_token: {"in":"query","name":"refresh_token","required":true,"dataType":"string"},
                    id_token: {"in":"query","name":"id_token","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<AuthController>(AuthController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.logout.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/users/basic',
            authenticateMiddleware([{"jwt":["teacher","admin","student"]}]),
            function UsersController_basic(request: any, response: any, next: any) {
            const args = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<UsersController>(UsersController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.basic.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/users/scope',
            authenticateMiddleware([{"jwt":["teacher","admin","student"]}]),
            function UsersController_getScope(request: any, response: any, next: any) {
            const args = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<UsersController>(UsersController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.getScope.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/users/create',
            authenticateMiddleware([{"jwt":["admin"]}]),
            function UsersController_create(request: any, response: any, next: any) {
            const args = {
                    options: {"in":"body","name":"options","required":true,"ref":"CreateUser"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<UsersController>(UsersController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.create.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/users/create-csv',
            authenticateMiddleware([{"jwt":["admin"]}]),
            function UsersController_createCSV(request: any, response: any, next: any) {
            const args = {
                    options: {"in":"body","name":"options","required":true,"ref":"CreateUserCSV"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<UsersController>(UsersController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.createCSV.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.put('/users/update',
            authenticateMiddleware([{"jwt":["admin"]}]),
            function UsersController_updateUser(request: any, response: any, next: any) {
            const args = {
                    options: {"in":"body","name":"options","required":true,"dataType":"array","array":{"ref":"UpdateUser"}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<UsersController>(UsersController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.updateUser.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.delete('/users/delete',
            authenticateMiddleware([{"jwt":["admin"]}]),
            function UsersController_delete(request: any, response: any, next: any) {
            const args = {
                    users: {"in":"body","name":"users","required":true,"dataType":"array","array":{"dataType":"string"}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<UsersController>(UsersController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.delete.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/users/user-by-roll-no',
            authenticateMiddleware([{"jwt":["admin"]}]),
            function UsersController_getUserByRollNo(request: any, response: any, next: any) {
            const args = {
                    rollNo: {"in":"query","name":"rollNo","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<UsersController>(UsersController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.getUserByRollNo.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.put('/users/changePassword',
            authenticateMiddleware([{"jwt":["teacher","admin","student"]}]),
            function UsersController_changePassword(request: any, response: any, next: any) {
            const args = {
                    options: {"in":"body","name":"options","required":true,"ref":"UpdatePasswordRequest"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<UsersController>(UsersController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.changePassword.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.put('/users/requestReset',
            function UsersController_requestReset(request: any, response: any, next: any) {
            const args = {
                    user: {"in":"body","name":"user","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"user":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<UsersController>(UsersController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.requestReset.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/users/validReset',
            function UsersController_validReset(request: any, response: any, next: any) {
            const args = {
                    code: {"in":"query","name":"code","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<UsersController>(UsersController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.validReset.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.put('/users/resetPassword',
            function UsersController_resetPass(request: any, response: any, next: any) {
            const args = {
                    options: {"in":"body","name":"options","required":true,"ref":"ResetPasswordRequest"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<UsersController>(UsersController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.resetPass.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/users/tracked-data',
            authenticateMiddleware([{"jwt":["admin"]}]),
            function UsersController_getTrackedData(request: any, response: any, next: any) {
            const args = {
                    page: {"in":"query","name":"page","required":true,"dataType":"double"},
                    sortBy: {"in":"query","name":"sortBy","required":true,"dataType":"union","subSchemas":[{"dataType":"enum","enums":["ip"]},{"dataType":"enum","enums":["device"]},{"dataType":"enum","enums":["browser"]},{"dataType":"enum","enums":["platform"]},{"dataType":"enum","enums":["createdAt"]}]},
                    dir: {"in":"query","name":"dir","required":true,"dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]}]},
                    startTime: {"in":"query","name":"startTime","dataType":"string"},
                    endTime: {"in":"query","name":"endTime","dataType":"string"},
                    ip: {"in":"query","name":"ip","dataType":"string"},
                    pageSize: {"default":25,"in":"query","name":"pageSize","dataType":"double"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<UsersController>(UsersController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.getTrackedData.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.put('/notifications/subscribe',
            authenticateMiddleware([{"jwt":["teacher","admin","student"]}]),
            function NotificationController_subscribe(request: any, response: any, next: any) {
            const args = {
                    options: {"in":"body","name":"options","required":true,"ref":"SubscribeOptions"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<NotificationController>(NotificationController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.subscribe.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/notifications/unsubscribe',
            authenticateMiddleware([{"jwt":["teacher","admin","student"]}]),
            function NotificationController_unsubscribe(request: any, response: any, next: any) {
            const args = {
                    options: {"in":"body","name":"options","required":true,"ref":"UnSubscribeOptions"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<NotificationController>(NotificationController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.unsubscribe.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/notifications/isSubscribed',
            authenticateMiddleware([{"jwt":["teacher","admin","student"]}]),
            function NotificationController_isSubscribed(request: any, response: any, next: any) {
            const args = {
                    name: {"in":"query","name":"name","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<NotificationController>(NotificationController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.isSubscribed.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/notifications/custom-notify',
            authenticateMiddleware([{"jwt":["admin"]}]),
            function NotificationController_customNotify(request: any, response: any, next: any) {
            const args = {
                    options: {"in":"body","name":"options","required":true,"ref":"CustomNotifyOptions"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<NotificationController>(NotificationController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.customNotify.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/downloads/temp',
            authenticateMiddleware([{"jwt":["admin","student","teacher"]}]),
            function DownloadController_temporaryDownload(request: any, response: any, next: any) {
            const args = {
                    file: {"in":"query","name":"file","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<DownloadController>(DownloadController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.temporaryDownload.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/downloads/class-resource',
            authenticateMiddleware([{"jwt":["admin","student","teacher"]}]),
            function DownloadController_getClassResource(request: any, response: any, next: any) {
            const args = {
                    fileId: {"in":"query","name":"fileId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<DownloadController>(DownloadController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.getClassResource.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/downloads/class-resource',
            authenticateMiddleware([{"jwt":["admin","teacher"]}]),
            function DownloadController_addClassResource(request: any, response: any, next: any) {
            const args = {
                    options: {"in":"body","name":"options","required":true,"ref":"AddClassResourceOptions"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<DownloadController>(DownloadController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.addClassResource.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.delete('/downloads/class-resource',
            authenticateMiddleware([{"jwt":["admin","teacher"]}]),
            function DownloadController_deleteClassResource(request: any, response: any, next: any) {
            const args = {
                    fileId: {"in":"query","name":"fileId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<DownloadController>(DownloadController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.deleteClassResource.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/downloads/class-resource/tracked',
            authenticateMiddleware([{"jwt":["admin","teacher"]}]),
            function DownloadController_getTrackedClassResource(request: any, response: any, next: any) {
            const args = {
                    fileId: {"in":"query","name":"fileId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<DownloadController>(DownloadController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.getTrackedClassResource.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/classes',
            authenticateMiddleware([{"jwt":["admin","teacher","student"]}]),
            function ClassController_getClasses(request: any, response: any, next: any) {
            const args = {
                    sortBy: {"in":"query","name":"sortBy","required":true,"dataType":"union","subSchemas":[{"dataType":"enum","enums":["batch"]},{"dataType":"enum","enums":["teacher"]},{"dataType":"enum","enums":["elective"]}]},
                    dir: {"in":"query","name":"dir","required":true,"dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]}]},
                    page: {"in":"query","name":"page","required":true,"dataType":"double"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    id: {"in":"query","name":"id","dataType":"string"},
                    batch: {"in":"query","name":"batch","dataType":"string"},
                    teacher: {"in":"query","name":"teacher","dataType":"string"},
                    pageSize: {"default":25,"in":"query","name":"pageSize","dataType":"double"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<ClassController>(ClassController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.getClasses.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/classes/active',
            authenticateMiddleware([{"jwt":["student","teacher"]}]),
            function ClassController_getActiveClasses(request: any, response: any, next: any) {
            const args = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<ClassController>(ClassController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.getActiveClasses.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/classes/students',
            authenticateMiddleware([{"jwt":["teacher","admin"]}]),
            function ClassController_getStudents(request: any, response: any, next: any) {
            const args = {
                    id: {"in":"query","name":"id","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<ClassController>(ClassController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.getStudents.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.delete('/classes',
            authenticateMiddleware([{"jwt":["admin"]}]),
            function ClassController_deleteClasses(request: any, response: any, next: any) {
            const args = {
                    classes: {"in":"query","name":"class","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<ClassController>(ClassController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.deleteClasses.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/classes/request-elective-change',
            authenticateMiddleware([{"jwt":["student"]}]),
            function ClassController_requestElectiveChange(request: any, response: any, next: any) {
            const args = {
                    options: {"in":"body","name":"options","required":true,"ref":"RequestElectiveChangeOptions"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<ClassController>(ClassController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.requestElectiveChange.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/classes/request-elective-change',
            authenticateMiddleware([{"jwt":["admin"]}]),
            function ClassController_getElectiveChangeRequests(request: any, response: any, next: any) {
            const args = {
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<ClassController>(ClassController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.getElectiveChangeRequests.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/classes/confirm-elective-change',
            authenticateMiddleware([{"jwt":["admin"]}]),
            function ClassController_confirmElectiveChange(request: any, response: any, next: any) {
            const args = {
                    id: {"in":"query","name":"id","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<ClassController>(ClassController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.confirmElectiveChange.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.delete('/classes/remove-change-request',
            authenticateMiddleware([{"jwt":["admin"]}]),
            function ClassController_deleteElectiveChange(request: any, response: any, next: any) {
            const args = {
                    id: {"in":"query","name":"id","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<ClassController>(ClassController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.deleteElectiveChange.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/classes/valid-request-electives',
            authenticateMiddleware([{"jwt":["student"]}]),
            function ClassController_getValidRequestElectives(request: any, response: any, next: any) {
            const args = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<ClassController>(ClassController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.getValidRequestElectives.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/classes/can-request-elective-change',
            authenticateMiddleware([{"jwt":["student"]}]),
            function ClassController_canRequestElectiveChange(request: any, response: any, next: any) {
            const args = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<ClassController>(ClassController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.canRequestElectiveChange.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.put('/forms/create-form',
            authenticateMiddleware([{"jwt":["admin"]}]),
            function FormsController_createForm(request: any, response: any, next: any) {
            const args = {
                    options: {"in":"body","name":"options","required":true,"ref":"CreateFormOptions"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<FormsController>(FormsController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.createForm.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/forms/batches',
            authenticateMiddleware([{"jwt":["admin"]}]),
            function FormsController_getBatches(request: any, response: any, next: any) {
            const args = {
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<FormsController>(FormsController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.getBatches.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/forms/active-forms',
            authenticateMiddleware([{"jwt":["teacher","admin","student"]}]),
            function FormsController_activeForms(request: any, response: any, next: any) {
            const args = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<FormsController>(FormsController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.activeForms.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/forms',
            authenticateMiddleware([{"jwt":["admin","teacher"]}]),
            function FormsController_allForms(request: any, response: any, next: any) {
            const args = {
                    pageNumber: {"in":"query","name":"pageNumber","required":true,"dataType":"double"},
                    limit: {"in":"query","name":"limit","required":true,"dataType":"double"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<FormsController>(FormsController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.allForms.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/forms/generate-elective-list',
            authenticateMiddleware([{"jwt":["admin","teacher"]}]),
            function FormsController_generateList(request: any, response: any, next: any) {
            const args = {
                    id: {"in":"query","name":"id","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    closeForm: {"default":false,"in":"query","name":"closeForm","dataType":"boolean"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<FormsController>(FormsController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.generateList.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/forms/raw-list',
            authenticateMiddleware([{"jwt":["admin","teacher"]}]),
            function FormsController_genRawList(request: any, response: any, next: any) {
            const args = {
                    id: {"in":"query","name":"id","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<FormsController>(FormsController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.genRawList.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/forms/create-classes',
            authenticateMiddleware([{"jwt":["admin"]}]),
            function FormsController_createClass(request: any, response: any, next: any) {
            const args = {
                    formId: {"in":"query","name":"formId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<FormsController>(FormsController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.createClass.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/forms',
            authenticateMiddleware([{"jwt":["admin"]}]),
            function FormsController_updateForm(request: any, response: any, next: any) {
            const args = {
                    options: {"in":"body","name":"options","required":true,"ref":"UpdateFormOptions"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<FormsController>(FormsController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.updateForm.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.delete('/forms',
            authenticateMiddleware([{"jwt":["admin"]}]),
            function FormsController_deleteForm(request: any, response: any, next: any) {
            const args = {
                    id: {"in":"query","name":"id","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<FormsController>(FormsController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.deleteForm.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.put('/forms/explicit',
            authenticateMiddleware([{"jwt":["admin","teacher"]}]),
            function FormsController_setExplicit(request: any, response: any, next: any) {
            const args = {
                    options: {"in":"body","name":"options","required":true,"ref":"AddExplicitOptions"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<FormsController>(FormsController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.setExplicit.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.put('/form-response',
            authenticateMiddleware([{"jwt":["student"]}]),
            function ResponseController_formResponse(request: any, response: any, next: any) {
            const args = {
                    options: {"in":"body","name":"options","required":true,"ref":"FormResponseOptions"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<ResponseController>(ResponseController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.formResponse.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/form-response',
            authenticateMiddleware([{"jwt":["admin","teacher"]}]),
            function ResponseController_getResponses(request: any, response: any, next: any) {
            const args = {
                    id: {"in":"query","name":"id","required":true,"dataType":"string"},
                    pageNumber: {"in":"query","name":"pageNumber","required":true,"dataType":"double"},
                    limit: {"in":"query","name":"limit","required":true,"dataType":"double"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<ResponseController>(ResponseController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.getResponses.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/quizzes/create-quiz',
            authenticateMiddleware([{"jwt":["teacher"]}]),
            function QuizzesController_createQuiz(request: any, response: any, next: any) {
            const args = {
                    options: {"in":"body","name":"options","required":true,"ref":"CreateQuizOptions"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<QuizzesController>(QuizzesController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.createQuiz.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/quizzes/new',
            authenticateMiddleware([{"jwt":["student","teacher"]}]),
            function QuizzesController_getNewQuizzes(request: any, response: any, next: any) {
            const args = {
                    classId: {"in":"query","name":"classId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<QuizzesController>(QuizzesController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.getNewQuizzes.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/quizzes/old',
            authenticateMiddleware([{"jwt":["student"]}]),
            function QuizzesController_getOldQuizzes(request: any, response: any, next: any) {
            const args = {
                    classId: {"in":"query","name":"classId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<QuizzesController>(QuizzesController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.getOldQuizzes.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/quizzes/results',
            authenticateMiddleware([{"jwt":["teacher"]}]),
            function QuizzesController_getResults(request: any, response: any, next: any) {
            const args = {
                    quizId: {"in":"query","name":"quizId","required":true,"dataType":"string"},
                    page: {"in":"query","name":"page","required":true,"dataType":"double"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    limit: {"default":25,"in":"query","name":"limit","dataType":"double"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<QuizzesController>(QuizzesController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.getResults.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.put('/quizzes/start-quiz',
            authenticateMiddleware([{"jwt":["student"]}]),
            function QuizzesController_startQuiz(request: any, response: any, next: any) {
            const args = {
                    options: {"in":"body","name":"options","required":true,"ref":"StartQuizOptions"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<QuizzesController>(QuizzesController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.startQuiz.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/quizzes/question',
            authenticateMiddleware([{"quiz":["student"]}]),
            function QuizzesController_getNextQuestion(request: any, response: any, next: any) {
            const args = {
                    questionNumber: {"in":"query","name":"num","required":true,"dataType":"double"},
                    dir: {"in":"query","name":"dir","required":true,"dataType":"union","subSchemas":[{"dataType":"enum","enums":["next"]},{"dataType":"enum","enums":["prev"]}]},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    answer: {"in":"query","name":"ans","required":true,"dataType":"double"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<QuizzesController>(QuizzesController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.getNextQuestion.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/quizzes/submit-quiz',
            authenticateMiddleware([{"quiz":["student"]}]),
            function QuizzesController_closeQuiz(request: any, response: any, next: any) {
            const args = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<QuizzesController>(QuizzesController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.closeQuiz.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.put('/quizzes/publish-score',
            authenticateMiddleware([{"jwt":["teacher"]}]),
            function QuizzesController_publishScores(request: any, response: any, next: any) {
            const args = {
                    quizId: {"in":"query","name":"quizId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<QuizzesController>(QuizzesController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.publishScores.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.delete('/quizzes',
            authenticateMiddleware([{"jwt":["teacher"]}]),
            function QuizzesController_deleteQuiz(request: any, response: any, next: any) {
            const args = {
                    quizId: {"in":"query","name":"quizId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<QuizzesController>(QuizzesController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.deleteQuiz.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.put('/quizzes',
            authenticateMiddleware([{"jwt":["teacher"]}]),
            function QuizzesController_updateQuiz(request: any, response: any, next: any) {
            const args = {
                    options: {"in":"body","name":"options","required":true,"ref":"UpdateQuizOptions"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);
            } catch (err) {
                return next(err);
            }

            const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

            const controller: any = container.get<QuizzesController>(QuizzesController);
            if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
            }


            const promise = controller.updateQuiz.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, undefined, next);
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function authenticateMiddleware(security: TsoaRoute.Security[] = []) {
        return function runAuthenticationMiddleware(request: any, _response: any, next: any) {
            let responded = 0;
            let success = false;

            const succeed = function(user: any) {
                if (!success) {
                    success = true;
                    responded++;
                    request['user'] = user;
                    next();
                }
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            const fail = function(error: any) {
                responded++;
                if (responded == security.length && !success) {
                    error.status = error.status || 401;
                    next(error)
                }
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            for (const secMethod of security) {
                if (Object.keys(secMethod).length > 1) {
                    let promises: Promise<any>[] = [];

                    for (const name in secMethod) {
                        promises.push(expressAuthentication(request, name, secMethod[name]));
                    }

                    Promise.all(promises)
                        .then((users) => { succeed(users[0]); })
                        .catch(fail);
                } else {
                    for (const name in secMethod) {
                        expressAuthentication(request, name, secMethod[name])
                            .then(succeed)
                            .catch(fail);
                    }
                }
            }
        }
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function isController(object: any): object is Controller {
        return 'getHeaders' in object && 'getStatus' in object && 'setStatus' in object;
    }

    function promiseHandler(controllerObj: any, promise: any, response: any, successStatus: any, next: any) {
        return Promise.resolve(promise)
            .then((data: any) => {
                let statusCode = successStatus;
                let headers;
                if (isController(controllerObj)) {
                    headers = controllerObj.getHeaders();
                    statusCode = controllerObj.getStatus() || statusCode;
                }

                // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

                returnHandler(response, statusCode, data, headers)
            })
            .catch((error: any) => next(error));
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function returnHandler(response: any, statusCode?: number, data?: any, headers: any = {}) {
        if (response.headersSent) {
            return;
        }
        Object.keys(headers).forEach((name: string) => {
            response.set(name, headers[name]);
        });
        if (data && typeof data.pipe === 'function' && data.readable && typeof data._read === 'function') {
            data.pipe(response);
        } else if (data !== null && data !== undefined) {
            response.status(statusCode || 200).json(data);
        } else {
            response.status(statusCode || 204).end();
        }
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function responder(response: any): TsoaResponse<HttpStatusCodeLiteral, unknown>  {
        return function(status, data, headers) {
            returnHandler(response, status, data, headers);
        };
    };

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function getValidatedArgs(args: any, request: any, response: any): any[] {
        const fieldErrors: FieldErrors  = {};
        const values = Object.keys(args).map((key) => {
            const name = args[key].name;
            switch (args[key].in) {
                case 'request':
                    return request;
                case 'query':
                    return validationService.ValidateParam(args[key], request.query[name], name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"silently-remove-extras"});
                case 'path':
                    return validationService.ValidateParam(args[key], request.params[name], name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"silently-remove-extras"});
                case 'header':
                    return validationService.ValidateParam(args[key], request.header(name), name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"silently-remove-extras"});
                case 'body':
                    return validationService.ValidateParam(args[key], request.body, name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"silently-remove-extras"});
                case 'body-prop':
                    return validationService.ValidateParam(args[key], request.body[name], name, fieldErrors, 'body.', {"noImplicitAdditionalProperties":"silently-remove-extras"});
                case 'formData':
                    if (args[key].dataType === 'file') {
                        return validationService.ValidateParam(args[key], request.file, name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"silently-remove-extras"});
                    } else if (args[key].dataType === 'array' && args[key].array.dataType === 'file') {
                        return validationService.ValidateParam(args[key], request.files, name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"silently-remove-extras"});
                    } else {
                        return validationService.ValidateParam(args[key], request.body[name], name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"silently-remove-extras"});
                    }
                case 'res':
                    return responder(response);
            }
        });

        if (Object.keys(fieldErrors).length > 0) {
            throw new ValidateError(fieldErrors, '');
        }
        return values;
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
