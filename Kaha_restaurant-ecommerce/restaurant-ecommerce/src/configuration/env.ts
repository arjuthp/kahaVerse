import "dotenv/config";
import { Env } from "./interface/env.interface";

const config: Env = {
  app: {
    env: process.env.ENV,
    port: parseInt(process.env.APP_PORT, 10),
    kaha_api_base_link: process.env.KAHA_API_LINK,
  },
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    name: process.env.DB_NAME,
    username: process.env.DB_USER_NAME,
    password: process.env.DB_PASSWORD,
  },

  jwt: {
    secret: process.env.JWT_SECRET_TOKEN,
  },

  kahaMainApiUrl: {
    url: process.env.KAHA_API_LINK,
  },

  kahaMainV3BaseURL: {
    url: process.env.KAH_API_V3_BASE_URL,
  },
};

export const env = Object.freeze<Env>(config);

export const environment = (): any => ({ ...env });
