import { Global, Module } from "@nestjs/common";
import { ServiceCommunicationService } from "./service-communication.service";
import { HttpModule } from "@nestjs/axios";

@Global()
@Module({
  imports: [HttpModule],
  providers: [ServiceCommunicationService],
  exports: [ServiceCommunicationService],
})
export class ServiceCommunicationModule {}
