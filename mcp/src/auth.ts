import { AuthSupevisor } from "@cloudbase/toolbox";
import { debug } from "./utils/logger.js";

const auth = AuthSupevisor.getInstance({});

export async function getLoginState(options?: {
  fromCloudBaseLoginPage?: boolean;
}) {
  const {
    TENCENTCLOUD_SECRETID,
    TENCENTCLOUD_SECRETKEY,
    TENCENTCLOUD_SESSIONTOKEN,
  } = process.env;
  debug("TENCENTCLOUD_SECRETID", { secretId: TENCENTCLOUD_SECRETID });
  if (TENCENTCLOUD_SECRETID && TENCENTCLOUD_SECRETKEY) {
    debug("loginByApiSecret");
    return {
      secretId: TENCENTCLOUD_SECRETID,
      secretKey: TENCENTCLOUD_SECRETKEY,
      token: TENCENTCLOUD_SESSIONTOKEN,
    };
    // await auth.loginByApiSecret(TENCENTCLOUD_SECRETID, TENCENTCLOUD_SECRETKEY, TENCENTCLOUD_SESSIONTOKEN)
  }

  const loginState = await auth.getLoginState();
  if (!loginState) {
    await auth.loginByWebAuth(
      options?.fromCloudBaseLoginPage
        ? {
            getAuthUrl: (url) =>
              `https://tcb.cloud.tencent.com/login?_redirect_uri=${encodeURIComponent(url)}`,
          }
        : {},
    );
    const loginState = await auth.getLoginState();
    debug("loginByWebAuth", loginState);
    return loginState;
  } else {
    return loginState;
  }
}

export async function logout() {
  const result = await auth.logout();
  return result;
}
