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
import { ApiTags } from "@nestjs/swagger";

@ApiTags("addons")
@Controller("addons")
export class AddonsController {
  constructor(private readonly addonsService: AddonsService) {}

  @Post() createAddOn(@Body() createAddOnDto: CreateAddOnDto) {
    return this.addonsService.createAddOn(createAddOnDto);
  }

  @Get() findAllAddOns() {
    return this.addonsService.findAllAddOns();
  }

  @Get(":id") findAddOnById(@Param("id") id: string) {
    return this.addonsService.findAddOnById(id);
  }

  @Patch(":id") updateAddOn(
    @Param("id") id: string,
    @Body() body: UpdateAddOnsDto
  ) {
    return this.addonsService.updateAddOn(id, body);
  }

  @Delete(":id") deleteAddOn(@Param("id") id: string) {
    return this.addonsService.deleteAddOn(id);
  }
}
