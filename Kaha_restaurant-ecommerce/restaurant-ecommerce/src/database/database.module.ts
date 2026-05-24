import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { env } from "src/configuration/env";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (): any => {
        return {
          type: "postgres",
          host: env.database.host,
          port: env.database.port,
          database: env.database.name,
          username: env.database.username,
          password: env.database.password,
          entities: ["dist/**/*.entity.{ts,js}"],
          synchronize: true,
          migrationsTableName: "migrations",
          migrations: ["dist/migration/*.js"],
          migrationsRun: true,
          cli: {
            migrationsDir: "src/migrations",
          },
        };
      },
    }),
  ],
})
export class DatabaseModule {}
