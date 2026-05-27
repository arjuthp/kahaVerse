import { Controller, Post, Get, Patch, Delete, Body, Param } from '@nestjs/common';
import { AddonGroupsService } from './addon-groups.service';
import { CreateAddonGroupDto, CreateAddonDto, UpdateAddonDto } from './dtos';
import { ParseUUIDPipe } from 'common/pipes';

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
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.addonGroupsService.findOne(id);
  }

  @Patch(':id')
  updateGroup(@Param('id', ParseUUIDPipe) id: string, @Body() body: Partial<CreateAddonGroupDto>) {
    return this.addonGroupsService.updateGroup(id, body);
  }

  @Delete(':id')
  deleteGroup(@Param('id', ParseUUIDPipe) id: string) {
    return this.addonGroupsService.deleteGroup(id);
  }

  @Post(':id/addons')
  addAddonToGroup(@Param('id', ParseUUIDPipe) id: string, @Body() body: CreateAddonDto) {
    return this.addonGroupsService.addAddonToGroup(id, body);
  }

  @Patch(':id/addons/:addonId')
  updateAddon(@Param('id', ParseUUIDPipe) id: string, @Param('addonId', ParseUUIDPipe) addonId: string, @Body() body: UpdateAddonDto) {
    return this.addonGroupsService.updateAddon(addonId, body);
  }

  @Delete(':id/addons/:addonId')
  deleteAddon(@Param('id', ParseUUIDPipe) id: string, @Param('addonId', ParseUUIDPipe) addonId: string) {
    return this.addonGroupsService.deleteAddon(addonId);
  }
}
