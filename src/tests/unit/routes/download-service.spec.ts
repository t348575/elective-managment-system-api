import { UnitHelper } from '../../unit-helper';
const unitHelper = new UnitHelper();
import { Container } from 'typescript-ioc';
import * as argon2 from 'argon2';
import { IDownloadModel,DownloadFormatter } from '../../../models/mongo/download-repository';
import { PrivateInjectorInit } from '../../../routes/private-injector-init';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as qs from 'query-string';
import {DownloadService} from "../../../routes/download/service";
chai.use(chaiAsPromised);

let downloads:IDownloadModel[]=[];
let code:'String';

describe('Download service',()=>{
    const downloadService=Container.get(DownloadService);
    it('should add temporary user link',async()=>{
        for (const v of downloads) {
            // @ts-ignore
            const res=await downloadService.addTemporaryUserLink(v.id,v.path);
            expect(res).to.be.instanceOf(DownloadFormatter);
        }
    })

})