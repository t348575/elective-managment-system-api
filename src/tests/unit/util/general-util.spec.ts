import { expect } from 'chai';
import {
    checkNumber, checkString, chunkArray,
    cleanQuery,
    decipherJWT,
    getJWT,
    isId,
    safeParse
} from '../../../util/general-util';
import constants from '../../../constants';
import testingConstants from '../../testing-constants';
import {init} from '../../unit-helper';

init();

describe('General utils', () => {

    describe('safeParse', () => {
        it('should parse a valid json', async () => {
            expect(safeParse('{"test":1}')).to.deep.equal({ test: 1 });
        });
        it('should use a default on invalid json', async () => {
            expect(safeParse('{syntax error}', { test: 2 })).to.deep.equal({ test: 2 });
        });
    });

    describe('cleanQuery', () => {
        it('should change strings to objects', async () => {
            expect(cleanQuery('{"a":1,"b":true}')).to.deep.equal({ a: 1, b: true });
        });

        it('should change strings to regex', async () => {
            expect(cleanQuery('{"test":"hi"}').test).to.be.an.instanceof(RegExp);
        });

        it('should NOT change id fields type, but change keys to "_id"', async () => {
            expect(typeof cleanQuery('{"id":"hi"}').id).to.equal('string');
            expect(typeof cleanQuery('{"_id":"hi"}')._id).to.equal('string');
        });

        it('should return the same query', async () => {
            expect(cleanQuery({ a: 1, b: true })).to.be.an('object');
        });

        it('should return an empty object', async () => {
            expect(cleanQuery(null)).to.deep.equal({});
        });
    });

    describe('isId', () => {
        it('should identify an "id" key', async () => {
            expect(isId('id')).to.be.true;
            expect(isId('_id')).to.be.true;
        });
        it('should identify a NOT "id" key', async () => {
            expect(isId('other')).to.be.false;
        });
    });

    describe('getJWT', () => {
        it('should return a JWT', async () => {
            const jwt = await getJWT({name: '', password: '', role: 'student', rollNo: '', username: '', id: '1234'}, 'asd', 900, 'accessToken', 'student');
            expect(jwt.expiry).to.be.approximately((new Date().getTime() / 1000) + 900, 2);
            expect(jwt.jwt).to.be.a('string');
        });
    });

    describe('decipherJWT', () => {
        it('should decode a JWT', async () => {
            const jwt = await getJWT({name: '', password: '', role: 'student', rollNo: '', username: '', id: '1234'}, 'asd', 900, 'accessToken', 'student');
            const tokenWithoutIgnore = await decipherJWT(jwt.jwt, 'accessToken', false);
            expect(tokenWithoutIgnore.id).to.be.equal('1234');
            expect(tokenWithoutIgnore.scope).to.be.equal('student');
            expect(tokenWithoutIgnore.exp).to.be.equal(jwt.expiry);
            expect(tokenWithoutIgnore.stateSlice).to.be.equal('asd');
            expect(tokenWithoutIgnore.sub).to.be.equal('accessToken');
        });
    });

    describe('checkNumber', () => {

        it('should identify a number from a string', () => {
            expect(checkNumber({ item: '12' }, 'item', true)).to.be.true;
            expect(checkNumber({ item: 'a12' }, 'item', true)).to.be.false;
        });

        it('should identify a number', () => {
            expect(checkNumber({ item: 12 }, 'item')).to.be.true;
            expect(checkNumber({ item: '12' }, 'item')).to.be.false;
        });

        it('should not identify nulls & undefined', () => {
            expect(checkNumber({ item: null }, 'item')).to.be.false;
            expect(checkNumber({ item: undefined }, 'item')).to.be.false;
        });

        it('should not identify null or undefined object', () => {
            expect(checkNumber(null, 'item')).to.be.false;
            expect(checkNumber(undefined, 'item')).to.be.false;
        });

    });

    describe('checkString', () => {

        it('should identify string', () => {
            expect(checkString({ item: 'asd' }, 'item')).to.be.true;
            expect(checkString({ item: 31 }, 'item')).to.be.false;
        });

        it('should allow length 0', () => {
            expect(checkString({ item: '' }, 'item')).to.be.false;
            expect(checkString({ item: '' }, 'item', undefined, false)).to.be.true;
        })

        it('should not identify nulls & undefined', () => {
            expect(checkString({ item: null }, 'item')).to.be.false;
            expect(checkString({ item: undefined }, 'item')).to.be.false;
        });

        it('should not identify null or undefined object', () => {
            expect(checkString(null, 'item')).to.be.false;
            expect(checkString(undefined, 'item')).to.be.false;
        });

        it('should use limit array', () => {
            expect(checkString({ item: 'asd' }, 'item', ['asd'])).to.be.true;
            expect(checkString({ item: 'asd' }, 'item', ['dsd'])).to.be.false;
            expect(checkString({ item: 'asd' }, 'item', [])).to.be.false;
        });

    });

    describe('chunkArray', () => {

        it('should chunk arrays', () => {
            const arr = new Array(16);
            expect(chunkArray(arr, 4)).length(4);
            expect(chunkArray(arr, 8)).length(8);
            expect(chunkArray(arr, 16)).length(16);
            expect(chunkArray(arr, 3)).length(3);
        });

    });

});
