export default {
    username: 'kjosephsubash@gmail.com',
    password: 'admin',
    scope: 'admin',
    userId: '603f9253cb206eafe3f18444',
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
    electives: {
        addRoute:'/electives/add',
        postElectiveRoute:'/electives'
    },
    users: {
        name: 'Users',
        basicRoute: '/users/basic',
        scopeRoute: '/users/scope',
        createRoute: '/users/create',
        userByRollNoRoute:'/users/user-by-roll-no',
        validResetRoute:'/users/validReset'
    },
    notifications:{
      unsubscribeRoute:'/notifications/unsubscribe'
    },


    privateKey: '',
    publicKey: ''
};
