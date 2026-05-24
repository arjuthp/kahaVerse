export class child {
  id: string;
  name: string;
  description?: string;
  icon: string;
  isActive: boolean;
}

export class ICategoryResponse {
  id: string;
  name: string;
  description?: string;
  icon: string;
  isActive: boolean;
  position: number;
  childrens: child[];
}
