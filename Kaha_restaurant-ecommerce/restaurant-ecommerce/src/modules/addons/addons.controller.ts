import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";

import { AddonsService } from "./addons.service";
import { CreateAddOnDto, UpdateAddOnsDto } from "./dto";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { ParseUUIDPipe } from "common/pipes";

@ApiTags("addons")
@ApiBearerAuth()
@Controller("addons")
export class AddonsController {
  constructor(private readonly addonsService: AddonsService) {}

  @Post() createAddOn(@Body() createAddOnDto: CreateAddOnDto) {
    return this.addonsService.createAddOn(createAddOnDto);
  }

  @Get() findAllAddOns() {
    return this.addonsService.findAllAddOns();
  }

  @Get(":id") findAddOnById(@Param("id", ParseUUIDPipe) id: string) {
    return this.addonsService.findAddOnById(id);
  }

  @Patch(":id") updateAddOn(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateAddOnsDto
  ) {
    return this.addonsService.updateAddOn(id, body);
  }

  @Delete(":id") deleteAddOn(@Param("id", ParseUUIDPipe) id: string) {
    return this.addonsService.deleteAddOn(id);
  }
}
