import { UnitHelper } from '../../unit-helper';
const unitHelper = new UnitHelper();
import { Container } from 'typescript-ioc';
import * as argon2 from 'argon2';
import { PrivateInjectorInit } from '../../../routes/private-injector-init';
import { IClassModel, ClassFormatter,ClassRepository } from '../../../models/mongo/class-repository';
import { IUserModel, UserFormatter } from '../../../models/mongo/user-repository';
import { ClassService } from '../../../routes/classes/service';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as qs from 'query-string';
chai.use(chaiAsPromised);
let classes: IClassModel[] = [];
let code: string;

/*
describe('Classes Service',()=>{
    const classesService=Container.get(ClassService);
    it('creates class',async()=>{
        for(const v of classes){
            const res=await classesService.createClass(v.elective,12)
        }
    })
})*/
