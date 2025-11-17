## Captcha handling and rate limits (Web SDK)

This file explains how captcha challenges and related rate limits work in CloudBase Auth v2 and how to integrate them with the Web SDK.

### When captchas are required

Captcha challenges may be triggered when:

- Username/password login fails repeatedly (e.g. 5 times).
- Sending SMS or email verification codes reaches **rate limits**.

Typical error codes:

- `error == "captcha_required"` – captcha is required for the request.
- `error == "captcha_invalid"` – captcha is invalid or expired; you must fetch a new one.

### High-level captcha flow

1. User performs an action (login or send code).
2. Backend returns an error indicating captcha is required.
3. The SDK adapter’s `openURIWithCallback` is called with a captcha URL.
4. You parse the URL and extract:
   - `captchaData` – image (Base64)
   - `state` – captcha state identifier
   - `token` – captcha token
5. You show the captcha to the user, collect their input, and call `auth.verifyCaptchaData`.
6. You signal the adapter that captcha was solved so it can retry the original operation.

### Example adapter structure

Pseudo-code (adapted from the official guide):

```ts
function genAdapter(options) {
  const adapter: SDKAdapterInterface = {
    captchaOptions: {
      openURIWithCallback: async (url: string) => {
        // 1. Parse captcha data from URL
        const { captchaData, state, token } = cloudbase.parseCaptcha(url);

        // 2. Notify your UI via an event bus
        options.EVENT_BUS.emit("CAPTCHA_DATA_CHANGE", {
          captchaData, // Base64 image
          state,
          token,
        });

        // 3. Wait for captcha verification result
        return new Promise((resolve) => {
          options.EVENT_BUS.once("RESOLVE_CAPTCHA_DATA", (res) => {
            // res is result of auth.verifyCaptchaData
            resolve(res);
          });
        });
      },
    },
  };
  return adapter;
}
```

### Wiring the adapter into the SDK

```ts
import cloudbase from "@cloudbase/js-sdk";

const EVENT_BUS = new EventBus();
const adapter = genAdapter({ EVENT_BUS });

cloudbase.useAdapters(adapter, { EVENT_BUS });

const app = cloudbase.init({
  env: "your-env-id",
  appSign: "app-id",
  appSecret: {
    appAccessKeyId: "version",
    appAccessKey: "secret",
  },
});

const auth = app.auth();
```

### UI-side handling

- Listen for captcha data:

```ts
let captchaState = {
  captchaData: "",
  state: "",
  token: "",
};

EVENT_BUS.on("CAPTCHA_DATA_CHANGE", ({ captchaData, state, token }) => {
  captchaState = { captchaData, state, token };
  // display captcha image in UI, e.g. <img src={captchaData} />
});
```

- Refresh captcha:

```ts
async function refreshCaptcha() {
  const result = await auth.createCaptchaData({ state: captchaState.state });
  captchaState = {
    ...captchaState,
    captchaData: result.data,
    token: result.token,
  };
}
```

- Verify captcha:

```ts
async function verifyCaptchaData(userInput: string) {
  const verifyResult = await auth.verifyCaptchaData({
    token: captchaState.token,
    key: userInput,
  });

  EVENT_BUS.emit("RESOLVE_CAPTCHA_DATA", verifyResult);
}
```

### Best practices

- Treat `captcha_required` as “show captcha if not already shown”.
- Treat `captcha_invalid` as “refresh captcha and ask user again”; avoid infinite loops.
- Add a user-friendly UI and retry logic for the original operation after captcha succeeds.


