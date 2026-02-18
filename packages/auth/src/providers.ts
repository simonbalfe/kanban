const id = process.env.GOOGLE_CLIENT_ID;
const secret = process.env.GOOGLE_CLIENT_SECRET;

export const configuredProviders:
  | { google: { clientId: string; clientSecret: string } }
  | Record<string, never> =
  id && id.length > 0 && secret && secret.length > 0
    ? { google: { clientId: id, clientSecret: secret } }
    : {};
