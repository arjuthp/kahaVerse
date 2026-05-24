import { Controller, Post, Get, Patch, Delete, Body, Param } from '@nestjs/common';
import { AddonGroupsService } from './addon-groups.service';
import { CreateAddonGroupDto, CreateAddonDto, UpdateAddonDto } from './dtos';

@Controller('addon-groups')
export class AddonGroupsController {
  constructor(private readonly addonGroupsService: AddonGroupsService) {}

  @Post()
  createGroup(@Body() body: CreateAddonGroupDto) {
    return this.addonGroupsService.createGroup(body);
  }

  @Get()
  findAll() {
    return this.addonGroupsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.addonGroupsService.findOne(id);
  }

  @Patch(':id')
  updateGroup(@Param('id') id: string, @Body() body: Partial<CreateAddonGroupDto>) {
    return this.addonGroupsService.updateGroup(id, body);
  }

  @Delete(':id')
  deleteGroup(@Param('id') id: string) {
    return this.addonGroupsService.deleteGroup(id);
  }

  @Post(':id/addons')
  addAddonToGroup(@Param('id') id: string, @Body() body: CreateAddonDto) {
    return this.addonGroupsService.addAddonToGroup(id, body);
  }

  @Patch(':id/addons/:addonId')
  updateAddon(@Param('id') id: string, @Param('addonId') addonId: string, @Body() body: UpdateAddonDto) {
    return this.addonGroupsService.updateAddon(addonId, body);
  }

  @Delete(':id/addons/:addonId')
  deleteAddon(@Param('id') id: string, @Param('addonId') addonId: string) {
    return this.addonGroupsService.deleteAddon(addonId);
  }
}
