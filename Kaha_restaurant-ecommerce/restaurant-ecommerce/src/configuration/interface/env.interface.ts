export interface App {
  port: number;
  env: string;
  kaha_api_base_link: string;
}

export interface Database {
  host: string;
  port: string;
  name: string;
  username: string;
  password: string;
}

export interface JWT {
  secret: string;
}

export interface KahaMainApiUrl {
  url: string;
}

export interface kahaMainV3BaseURL {
  url: string;
}
export interface Env {
  app: App;
  database: Database;
  jwt: JWT;
  kahaMainApiUrl: KahaMainApiUrl;
  kahaMainV3BaseURL: kahaMainV3BaseURL;
}
