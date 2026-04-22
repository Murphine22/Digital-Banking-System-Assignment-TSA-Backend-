export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  mongodbUri: process.env.MONGODB_URI ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // NIBSS Phoenix API Configuration
  nibssApiKey: process.env.NIBSS_API_KEY ?? "",
  nibssApiSecret: process.env.NIBSS_API_SECRET ?? "",
  nibssBaseUrl: process.env.NIBSS_BASE_URL ?? "https://nibssbyphoenix.onrender.com",
  fintechName: process.env.FINTECH_NAME ?? "",
  fintechEmail: process.env.FINTECH_EMAIL ?? "",
};
