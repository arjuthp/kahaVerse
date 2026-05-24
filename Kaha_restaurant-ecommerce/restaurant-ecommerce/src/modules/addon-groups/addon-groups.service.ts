import { Injectable, NotFoundException } from '@nestjs/common';
import { AddonGroupRepository, AddonsRepository } from 'src/repositories';
import { CreateAddonGroupDto, CreateAddonDto, UpdateAddonDto } from './dtos';

@Injectable()
export class AddonGroupsService {
  constructor(
    private readonly addonGroupRepository: AddonGroupRepository,
    private readonly addonRepository: AddonsRepository,
  ) {}

  async createGroup(body: CreateAddonGroupDto) {
    return this.addonGroupRepository.save(body);
  }

  async findAll() {
    return this.addonGroupRepository.find({ relations: ['addons'] });
  }

  async findOne(id: string) {
    const group = await this.addonGroupRepository.findOne({ where: { id }, relations: ['addons'] });
    if (!group) throw new NotFoundException('Addon Group not found');
    return group;
  }

  async updateGroup(id: string, body: Partial<CreateAddonGroupDto>) {
    await this.findOne(id); // Ensures it exists
    await this.addonGroupRepository.update(id, body);
    return this.findOne(id);
  }

  async deleteGroup(id: string) {
    const group = await this.findOne(id);
    group.isActive = false; // Soft delete
    return this.addonGroupRepository.save(group);
  }

  async addAddonToGroup(groupId: string, body: CreateAddonDto) {
    const group = await this.findOne(groupId);
    const addon = this.addonRepository.create({ ...body, addonGroup: group });
    return this.addonRepository.save(addon);
  }

  async updateAddon(addonId: string, body: UpdateAddonDto) {
    const addon = await this.addonRepository.findOne({ where: { id: addonId }, relations: ['addonGroup'] });
    if (!addon) throw new NotFoundException('Addon not found');
    
    // Only update the fields that are provided
    if (body.name !== undefined) addon.name = body.name;
    if (body.price !== undefined) addon.price = body.price;
    if (body.description !== undefined) addon.description = body.description;
    if (body.coverImg !== undefined) addon.coverImg = body.coverImg;
    if (body.isActive !== undefined) addon.isActive = body.isActive;
    if (body.sortOrder !== undefined) addon.sortOrder = body.sortOrder;
    
    const updated = await this.addonRepository.save(addon);
    return updated;
  }

  async deleteAddon(addonId: string) {
    const addon = await this.addonRepository.findOne({ where: { id: addonId } });
    if (!addon) throw new NotFoundException('Addon not found');
    addon.isActive = false; // Soft delete
    return this.addonRepository.save(addon);
  }
}
