import { ValueTransformer } from "typeorm";

export const valueTransformerUtil: ValueTransformer = {
  from(value) {
    return parseFloat(value);
  },
  to(value) {
    return value;
  },
};
