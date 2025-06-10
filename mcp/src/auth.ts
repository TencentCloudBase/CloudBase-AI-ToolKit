import  { AuthSupevisor } from  '@cloudbase/toolbox'
import { debug,error } from './utils/logger.js';

const auth = AuthSupevisor.getInstance({
})

export async function getLoginState() {
    const {
        TENCENTCLOUD_SECRETID,
        TENCENTCLOUD_SECRETKEY,
        TENCENTCLOUD_SESSIONTOKEN
    } = process.env
    debug('TENCENTCLOUD_SECRETID',TENCENTCLOUD_SECRETID)
    if (TENCENTCLOUD_SECRETID && TENCENTCLOUD_SECRETKEY) {
        debug('loginByApiSecret')
        await auth.loginByApiSecret(TENCENTCLOUD_SECRETID, TENCENTCLOUD_SECRETKEY, TENCENTCLOUD_SESSIONTOKEN)
    }
    const loginState = await auth.getLoginState()
    if (!loginState) {
        debug('loginByApiSecret')
       await auth.loginByWebAuth({})
       const loginState = await auth.getLoginState()
       return loginState
    } else {
        return loginState
    }
}

export async function logout() {
    const result = await auth.logout()
    return result
}