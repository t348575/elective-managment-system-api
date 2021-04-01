export default {
    username: 'kjosephsubash@gmail.com',
    password: 'admin',
    scope: 'admin',
    fromHexString: (hexString: string) => {
        // @ts-ignore
        return new Uint8Array(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
    },
    oauth: {
        name: 'OAuth2',
        loginRoute: '/oauth/authorize',
        tokenRoute: '/oauth/token',
        refreshRoute: '/oauth/refresh',
        logoutRoute: '/oauth/logout'
    },
    users: {
        name: 'Users',
        basicRoute: '/users/basic',
        scopeRoute: '/users/scope'
    },
    privateKey: '',
    publicKey: ''
};
