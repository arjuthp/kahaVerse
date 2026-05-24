import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Database } from "./interface/env.interface";

@Injectable()
export class ConfigurationService {
  public constructor(private readonly configService: ConfigService) {}

  public get appEnv(): string {
    return this.configService.get<string>("app.env") as string;
  }

  public get appPort(): number {
    return this.configService.get<number>("app.port") as number;
  }

  public get databaseConfig(): Database {
    const dbHost = this.configService.get<string>("database.host");
    const dbPort = this.configService.get<string>("database.port");
    const dbName = this.configService.get<string>("database.name");
    const dbUsername = this.configService.get<string>("database.username");
    const dbPassword = this.configService.get<string>("database.password");

    return {
      host: dbHost,
      port: dbPort,
      name: dbName,
      username: dbUsername,
      password: dbPassword,
    };
  }

  public get jwtSecret(): string {
    return this.configService.get<string>("jwt.secret");
  }

  public get kahaMainV3BaseURL(): string {
    return this.configService.get<string>("kahaMainV3BaseURL.url");
  }

  public get kahaMainApiUrl(): string {
    return this.configService.get<string>("kahaMainApiUrl.url");
  }

  public get kahaMainApiBaseUrl(): string {
    return this.configService.get<string>("app.kaha_api_base_link");
  }

  public get useMockAuth(): boolean {
    return this.configService.get<string>("USE_MOCK_AUTH") === 'true';
  }
}
