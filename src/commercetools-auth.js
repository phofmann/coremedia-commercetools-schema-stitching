import fetch from "cross-fetch";
import SdkAuth, {TokenProvider} from '@commercetools/sdk-auth';
import * as dotenv from "dotenv";

function onTokenInfoChanged(tokenInfo) {
}

const tokenInfo = null;

dotenv.config();

const tokenProvider = new TokenProvider({

  sdkAuth: new SdkAuth({
    host: process.env.CT_AUTH_HOST,
    projectKey: process.env.CT_PROJECT_KEY,
    credentials: {
      clientId: process.env.CT_CLIENT_ID,
      clientSecret: process.env.CT_CLIENT_SECRET,
    },
    scopes: [process.env.CT_SCOPE],
    fetch: fetch
  }),
  fetchTokenInfo: sdkAuth => sdkAuth.anonymousFlow(),
  onTokenInfoChanged: tokenInfo => onTokenInfoChanged(tokenInfo),
}, tokenInfo);

const buildAuthorizationHeader = () => tokenProvider.getTokenInfo()
        .then(tokenInfo => `${tokenInfo.token_type} ${tokenInfo.access_token}`);

export function getAuthToken() {
  return buildAuthorizationHeader().catch((error) => {
    // eslint-disable-next-line no-console
    console.warn('Could not connect to commercetools, cleaning up session...', error);
    return cleanUpSession().then(() => buildAuthorizationHeader());
  });
}
