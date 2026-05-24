import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { ConfigurationService } from "src/configuration/configuration.service";
import { JwtStrategy } from "./strategy/jwt.strategy";

@Module({
  imports: [],
  providers: [JwtStrategy],
})
export class AuthModule {}
