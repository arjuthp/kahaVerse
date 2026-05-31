import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigurationModule } from "configuration/configuration.module";
import { ConfigurationService } from "configuration/configuration.service";

import { JwtStrategy } from "./strategy/jwt.strategy";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UserRepository } from "src/repositories";
import { User } from "../../entities/user.entity";
import { ServiceCommunicationModule } from "../service-communication/service-communication.module";

@Module({
  imports: [
    ConfigurationModule,
    TypeOrmModule.forFeature([User]),
    ServiceCommunicationModule,
    JwtModule.registerAsync({
      imports: [ConfigurationModule],
      inject: [ConfigurationService],
      useFactory: (configService: ConfigurationService) => ({
        secret: configService.jwtSecret,
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  providers: [JwtStrategy, AuthService, UserRepository],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
