export default {
    port: 3000,
    privateKey: '',
    publicKey: '',
    environment: 'debug',
    baseUrl: 'https://localhost',
    mongoConnectionString: '',
    redisPassword: '',
    redisHost: '127.0.0.1',
    emailSuffix: {
        student: 'cb.students.amrita.edu',
        teacher: 'cb.amrita.edu'
    },
    jwtExpiry: {
        oneTimeAuthCodeExpiry: 60,
        refreshExpiry: 900,
        accessExpiry: 900,
        idExpiry: 86400
    },
    mailAccess: {
        host: '',
        username: '',
        password: '',
        name: ''
    },
    vapidKeys: {
        privateKey: '',
        publicKey: ''
    },
    emailTemplates: {
        userCreation: '/../../../resources/assets/user-creation.html',
        passReset: '/../../../resources/assets/pass-reset.html'
    },
    directories: {
        csvTemporary: '/../../../resources/csvTemp',
        classResources: '/../../../resources/classResources'
    },
    errorTypes: {
        db: {
            statusCode: 500,
            name: 'Internal Server Error',
            message: 'database error'
        },
        validation: {
            statusCode: 400,
            name: 'Bad Request',
            message: 'validation error'
        },
        auth: { statusCode: 401, name: 'Unauthorized', message: 'oauth error' },
        forbidden: {
            statusCode: 403,
            name: 'Forbidden',
            message: 'forbidden content'
        },
        notFound: {
            statusCode: 404,
            name: 'Not Found',
            message: 'content not found'
        },
        entity: {
            statusCode: 422,
            name: 'Unprocessable Entity',
            message: 'entity error'
        }
    },
    get errorMap() {
        return {
            ValidateError: this.errorTypes.validation,
            ValidationError: this.errorTypes.validation,
            CastError: this.errorTypes.db
        };
    }
};
