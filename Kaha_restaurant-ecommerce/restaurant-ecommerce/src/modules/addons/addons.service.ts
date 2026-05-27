import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { ISuccessReponse } from "common/responses/index";
import { CreateAddOnDto, UpdateAddOnsDto } from "./dto";
import { AddOnEntity } from "entities/addons.entity";
import { IAddonsResponseDto } from "./response";
import { AddonsRepository } from "src/repositories/index";
import { ILike } from "typeorm";

@Injectable()
export class AddonsService {
  constructor(private readonly addOnsRepository: AddonsRepository) {}

  async createAddOn(body: CreateAddOnDto): Promise<ISuccessReponse> {
    const existingaddons = await this.addOnsRepository.findOne({
      where: { name: ILike(body.name) },
    });

    if (
      existingaddons &&
      existingaddons.name.toLocaleLowerCase() === body.name.toLocaleLowerCase()
    ) {
      throw new ConflictException("Addons with the same name already exists.");
    }

    await this.addOnsRepository.save({ ...body });
    return { message: "The  addons was successfully created." };
  }

  async findAddOnById(id: string): Promise<IAddonsResponseDto> {
    const addons = await this.addOnsRepository.findOne({
      where: { id },
    });

    if (!addons) {
      throw new NotFoundException(`Addon with ID ${id} not found.`);
    }

    return this.transformToAddonResponse(addons);
  }

  async findAllAddOns(): Promise<IAddonsResponseDto[]> {
    const addonslist = await this.addOnsRepository.find();

    return addonslist?.map((each) => this.transformToAddonResponse(each));
  }

  async updateAddOn(
    id: string,
    body: UpdateAddOnsDto
  ): Promise<ISuccessReponse> {
    const existingaddons = await this.addOnsRepository.findOne({
      where: { id: id },
    });

    if (!existingaddons) {
      throw new NotFoundException(`Addon with ID ${id} not found`);
    }

    // Only check name conflict if name is being updated
    if (body.name && existingaddons.name.toLocaleLowerCase() !== body.name.toLocaleLowerCase()) {
      const dbaddons = await this.addOnsRepository.findOne({
        where: { name: ILike(body.name) },
      });

      if (dbaddons) {
        throw new ConflictException(
          "Addons with the same name already exists."
        );
      }
    }
    
    await this.addOnsRepository.update(id, body);
    return { message: "The  addons was successfully updated." };
  }

  async deleteAddOn(id: string): Promise<ISuccessReponse> {
    const result = await this.addOnsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Addon with ID ${id} not found`);
    }
    return { message: "The addons  was successfully deleted." };
  }

  private transformToAddonResponse(
    addonEntity: AddOnEntity
  ): IAddonsResponseDto {
    const { id, price, name, description, coverImg } = addonEntity;

    return {
      id,
      price,
      name,
      description,
      coverImg,
    };
  }
}
