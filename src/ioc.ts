import { Container } from 'typescript-ioc';
import { IocContainer } from '@tsoa/runtime';

export const iocContainer: IocContainer = {
    get: <T>(controller: { prototype: T }): T => {
        return Container.get<T>(controller as never);
    }
};
