import { UnitHelper } from '../../unit-helper';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const unitHelper = new UnitHelper();
import { expect } from 'chai';
import { stub } from 'sinon';
import { ApiError, ErrorHandler } from '../../../shared/error-handler';
import constants from '../../../constants';

describe('ErrorHandler', () => {
    it('should normalize errors', () => {
        const error = (ErrorHandler as any).normalizeError({});
        expect(error).to.be.an.instanceof(ApiError);
    });

    it('should handle errors', () => {
        const e = constants.errorTypes.notFound;
        const jsonStub = stub();
        const statusStub = stub().returns({ json: jsonStub });
        const nextStub = stub();
        ErrorHandler.handleError(
            new ApiError(e),
            // @ts-ignore
            null,
            { status: statusStub } as any,
            nextStub
        );
        expect(statusStub.calledWith(e.statusCode)).to.be.true; // tslint:disable-line
        expect(
            jsonStub.calledWith({
                name: e.name,
                message: e.message,
                fields: undefined
            })
        ).to.be.true; // tslint:disable-line
        expect(nextStub.calledOnce).to.be.true; // tslint:disable-line
    });
});
