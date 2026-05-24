import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";

import { CategoryService } from "./category.service";
import { CategoryController } from "./category.controller";

@Module({
  imports: [HttpModule],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
