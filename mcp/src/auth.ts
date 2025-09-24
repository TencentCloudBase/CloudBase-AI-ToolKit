import { AuthSupevisor } from '@cloudbase/toolbox';
import { debug } from './utils/logger.js';

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
        return {
            secretId: TENCENTCLOUD_SECRETID,
            secretKey: TENCENTCLOUD_SECRETKEY,
            token: TENCENTCLOUD_SESSIONTOKEN
        }
        // await auth.loginByApiSecret(TENCENTCLOUD_SECRETID, TENCENTCLOUD_SECRETKEY, TENCENTCLOUD_SESSIONTOKEN)
    }
    
    const loginState = await auth.getLoginState()
    if (!loginState) {
       await auth.loginByWebAuth({})
       const loginState = await auth.getLoginState()
       debug('loginByWebAuth',loginState)
       return loginState
    } else {
        return loginState
    }
}

export async function logout() {
    const result = await auth.logout()
    return result
}