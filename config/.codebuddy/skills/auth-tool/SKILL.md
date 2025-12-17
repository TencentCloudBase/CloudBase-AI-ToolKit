---
name: auth-tool-cloudbase
description: Use CloudBase Auth tool to configure and manage authentication providers for web applications - enable/disable login methods (SMS, Email, WeChat Open Platform, Google, Anonymous, Username/password, OAuth, SAML, CAS, Dingding, etc.) and configure provider settings via MCP tools.
alwaysApply: false
---

## When to use this skill

Use this skill for CloudBase Auth provider setting, such as:

- Turn on or turn off auth providers, such as Sms, Email, WeChat, Google, Anonymous, Username/password, OAuth, SAML, CAS, Dingding, etc.
- Setup auth provider settings
- Get auth provider settings

---

## How to use this skill (for a coding agent)

1. **Confirm CloudBase environment**
   - Ask the user for:
     - `env` – CloudBase environment ID

2. **ILoginStrategy interface**
    -`LoginStrategy` is a object that contains the following properties:
    ```ts
    interface ILoginStrategy {
        AnonymousLogin: boolean; // 是否开启匿名登录
        EmailLogin: boolean; // 是否开启邮箱登录方式
        UserNameLogin: boolean; // 是否开启用户名密码登录方式
        PhoneNumberLogin: boolean; // 是否开启短信登录方式
        Mfa: boolean; // 是否开启多因素认证
        // 短信验证码配置
        SmsVerificationConfig: {
            Type:  'apis' | 'default' // apis：微搭APIs, default：默认短信
            Method: string; // 方法名
            SmsDayLimit: number; // 短信发送日限额，如果不设上限，该值为 -1
        };
        // 	密码更新配置
        PwdUpdateStrategy: {
            FirstLoginUpdate: boolean; // 首次登录是否更新密码
            PeriodUpdate: boolean; // 是否定期更新
            PeriodValue: number; // 定期更新周期的值
            PeriodType: 'WEEK' | 'MONTH' | 'YEAR'; // 定期更新周期的时间单位
        };
        // 多因子登录配置
        MfaConfig: {
            On: 'TRUE' | 'FALSE'; // 是否开启多因子登录
            Sms: 'TRUE' | 'FALSE'; // 是否开启短信验证
            Email: 'TRUE' | 'FALSE'; // 是否开启邮箱验证
            RequiredBindPhone: 'TRUE' | 'FALSE'; // 是否强制绑定手机号
        }
    }
    ```
---


## All login scenarios (flat list)

### Scenario 1: Get Login Strategy

- Call `callCloudApi` with parameter to get Login Strategy and save the `result.Data` as `LoginStrategy`:
```ts
{
    "params":{
        "EnvId": `env`
    },
    "service":"lowcode",
    "action":"DescribeLoginStrategy"
}
```
- If `LoginStrategy` is empty, then return `false`.
- If `LoginStrategy` is not empty, then return `LoginStrategy` filter By ILoginStrategy interface.

### Scenario 2: Anonymous Login turn on/off

- Call `callCloudApi` with parameter to get Login Strategy and save the `result.Data` as `LoginStrategy`: 
```ts
{
    "params":{
        "EnvId": `env`
    },
    "service":"lowcode",
    "action":"DescribeLoginStrategy"
}
```
- If `LoginStrategy` is empty, then return `false`.
- If `LoginStrategy` is not empty, then set `LoginStrategy.AnonymousLogin` with boolean value `true`(Turn on) or `false`(Turn off).
- Call `callCloudApi` with parameter toupdate Login Strategy:
```ts
{
    "params":{
        "EnvId": `env`,
        ...LoginStrategy
    },
    "service":"lowcode",
    "action":"ModifyLoginStrategy"
}
```
- Return result.


### Scenario 3: Username/password Login turn on/off

- Call `callCloudApi` with parameter to get Login Strategy and save the `result.Data` as `LoginStrategy`: 
```ts
{
    "params":{
        "EnvId": `env`
    },
    "service":"lowcode",
    "action":"DescribeLoginStrategy"
}
```
- If `LoginStrategy` is empty, then return `false`.
- If `LoginStrategy` is not empty, then set `LoginStrategy.UserNameLogin` with boolean value `true`(Turn on) or `false`(Turn off).
- Call `callCloudApi` with parameter toupdate Login Strategy:
```ts
{
    "params":{
        "EnvId": `env`,
        ...LoginStrategy
    },
    "service":"lowcode",
    "action":"ModifyLoginStrategy"
}
```
- Return result.

### Scenario 4: Sms Login turn on/off

- Call `callCloudApi` with parameter to get Login Strategy and save the `result.Data` as `LoginStrategy`: 
```ts
{
    "params":{
        "EnvId": `env`
    },
    "service":"lowcode",
    "action":"DescribeLoginStrategy"
}
```
- If `LoginStrategy` is empty, then return `false`.
- If `LoginStrategy` is not empty, then set `LoginStrategy.PhoneNumberLogin` with boolean value `true`(Turn on) or `false`(Turn off).
- Call `callCloudApi` with parameter toupdate Login Strategy:
```ts
{
    "params":{
        "EnvId": `env`,
        ...LoginStrategy
    },
    "service":"lowcode",
    "action":"ModifyLoginStrategy"
}
```
- Return result.

### Scenario 5: Sms Login config

- Call `callCloudApi` with parameter to get Login Strategy and save the `result.Data` as `LoginStrategy`: 
```ts
{
    "params":{
        "EnvId": `env`
    },
    "service":"lowcode",
    "action":"DescribeLoginStrategy"
}
```
- If `LoginStrategy` is empty, then return `false`.
- If `LoginStrategy` is not empty, then set `LoginStrategy.SmsVerificationConfig`.
- Call `callCloudApi` with parameter toupdate Login Strategy:
```ts
{
    "params":{
        "EnvId": `env`,
        ...LoginStrategy
    },
    "service":"lowcode",
    "action":"ModifyLoginStrategy"
}
```
- Return result.

### Scenario 6: Email Login turn on/off

- Call `callCloudApi` with parameter toupdate Login Strategy:
```ts
{
    "params":{
        "EnvId": `env`,
        "Id": "email",
        "On": "TRUE" | "FALSE",
        "EmailConfig": {
            "On": "TRUE",
            "SmtpConfig": {
                "AccountPassword": "", 
                "AccountUsername": "", 
                "SecurityMode": "", 
                "SenderAddress": "", 
                "ServerHost": "", 
                "ServerPort": "", 
            }
        }
    },
    "service":"tcb",
    "action":"ModifyProvider"
}
```
- Return result.

### Scenario 7: Email Login config

- EmailConfig interface
```ts
interface IEmailConfig {
    On: 'TRUE' | 'FALSE'; // 是否开启邮件代发
    // 如果开启邮件代发，则以下字段为空字符串
    SmtpConfig: {
        AccountPassword: string; // SMTP 账号密码
        AccountUsername: string; // SMTP 账号
        SecurityMode: string; /// SMTP 安全模式
        SenderAddress: string; // 发件人地址
        ServerHost: string; // SMTP 服务器主机， QQ邮箱为"smtp.qq.com"，腾讯企业邮箱为"smtp.exmail.qq.com"
        ServerPort: string; // SMTP 服务器端口，QQ邮箱和腾讯企业邮箱为 465
    }
}
```
- Call `callCloudApi` with parameter toupdate Login Strategy, if `EmailConfig.On` is `TRUE`, then set`EmailConfig.SmtpConfig` with empty object, ohterwise `EmailConfig.On` is `FALSE`, then ask the user to provide `EmailConfig.SmtpConfig`
```ts
{
    "params":{
        "EnvId": `env`,
        "Id": "email",
        "EmailConfig": IEmailConfig
    },
    "service":"tcb",
    "action":"ModifyProvider"
}
```
- Return result.

### Scenario 8: WeChat Open Platform Login turn on/off

- Call `callCloudApi` with parameter to get all provider config then filter by `Id` is `wx_open`, and result save as `WeChatProvider`:
```ts
{
    "params":{
        "EnvId": `env`,
    },
    "service":"tcb",
    "action":"GetProviders"
}
```

- Let user to visit `WeChat Open Platform`(https://open.weixin.qq.com/cgi-bin/readtemplate?t=regist/regist_tmpl) get `AppID` and `AppSecret`,  then call `callCloudApi` with parameter to update WeChatProvider
```ts
{
    "params":{
        "EnvId": `env`,
        "Id": "wx_open",
        "On": "TRUE" | "FALSE",
        "Config": {
            ...WeChatProvider.Config,
            ClientId: `AppID`,
            ClientSecret: `AppSecret`,
        }
    },
    "service":"tcb",
    "action":"ModifyProvider"
}
```
- Return result.

### Scenario 9: Google Login turn on/off

- Call`callCloudApi` with parameter to get auth domain and save `result.Data.StaticDomain` as `staticDomain`:
```ts
{
    "params":{
        "EnvId": `env`,
    },
    "service":"lowcode",
    "action":"DescribeStaticDomain"
}
```

- Let user to visit `Google Cloud OAuth 2.0`(https://console.cloud.google.com/apis/credentials) get `Client ID` and `Client Secret`,  and set "https://`staticDomain`/__auth/" to `Authorized redirect URI`, then call `callCloudApi` with parameter to update
```ts
{
  params: {
    EnvId: `env`,
    ProviderType: 'OAUTH',
    Id: 'google',
    Name: {
        Message: 'Google',
    },
    Description: {
        Message: '',
    },
    Config: {
        EnvId: `env`,
        ClientId: `Client ID`,
        ClientSecret: `Client Secret`,
        Issuer: '',
        JwksUri: '',
        RedirectUri: '',
        Scope: 'email openid profile',
        AuthorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        TokenEndpoint: 'https://oauth2.googleapis.com/token',
        UserinfoEndpoint: 'https://www.googleapis.com/oauth2/v3/userinfo',
        RevocationEndpoint: '',
        ResponseType: '',
        SignoutEndpoint: '',
        TokenEndpointAuthMethod: 'CLIENT_SECRET_BASIC',
        SamlMetadata: '',
        RequestParametersMap: {
            RegisterUserSyncScope: 'syncEveryLogin',
            RegisterUserType: 'externalUser',
            IsGoogle: 'TRUE',
        },
        ResponseParametersMap: {
            Name: '',
            PhoneNumber: '',
            Sub: '',
            Username: '',
        },
        ProfileMetaMap: [],
        Proxy: '',
        UserinfoByAuthorizationCode: false,
        AuthorizationUserAgentMap: {},
        DisableProviderSub: false,
        StorageDb: '',
    },
    Picture: 'https://qcloudimg.tencent-cloud.cn/raw/f9131c00dcbcbccd5899a449d68da3ba.png',
    TransparentMode: 'FALSE',
    ReuseUserId: 'TRUE',
    AutoSignUpWithProviderUser: 'TRUE',
  },
  service: 'tcb',
  action: 'ModifyProvider',
}
```
- Return result.