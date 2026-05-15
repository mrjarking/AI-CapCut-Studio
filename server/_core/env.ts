export const ENV = {
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-in-production",
  oauthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  oauthPortalUrl: process.env.VITE_OAUTH_PORTAL_URL ?? "",
  appId: process.env.VITE_APP_ID ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  ownerName: process.env.OWNER_NAME ?? "",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "https://forge.manus.ai",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "3000"),
};
