export default {
	privateKey: '',
	publicKey: '',
	environment: 'debug',
	baseUrl: 'https://amrita-elective.tk',
	mongoConnectionString: 'mongodb://admin:bj9kSX99VWwwPw8@amrita-elective.tk:27017/amrita-elective?authSource=admin&readPreference=primary&appname=api&ssl=false',
	redisPassword: '960c3dac4fa81b4204779fd16ad7c954f95942876b9c4fb1a255667a9dbe389d',
	jwtExpiry: {
		oneTimeAuthCodeExpiry: 60
	},
	errorTypes: {
		db: { statusCode: 500, name: 'Internal Server Error', message: 'database error' },
		validation: { statusCode: 400, name: 'Bad Request', message: 'validation error' },
		auth: { statusCode: 401, name: 'Unauthorized', message: 'oauth error' },
		forbidden: { statusCode: 403, name: 'Forbidden', message: 'forbidden content' },
		notFound: { statusCode: 404, name: 'Not Found', message: 'content not found' },
		entity: { statusCode: 422, name: 'Unprocessable Entity', message: 'entity error' }
	},
	get errorMap() {
		return {
			ValidateError: this.errorTypes.validation,
			ValidationError: this.errorTypes.validation,
			CastError: this.errorTypes.db
		};
	}
}
