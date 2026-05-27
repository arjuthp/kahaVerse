import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigurationModule } from "configuration/configuration.module";
import { ConfigurationService } from "configuration/configuration.service";

import { JwtStrategy } from "./strategy/jwt.strategy";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [
    ConfigurationModule,
    JwtModule.registerAsync({
      imports: [ConfigurationModule],
      inject: [ConfigurationService],
      useFactory: (configService: ConfigurationService) => ({
        secret: configService.jwtSecret,
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  providers: [JwtStrategy, AuthService],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
