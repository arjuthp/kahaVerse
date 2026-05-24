export interface PayloadInterface {
  id: string;
  kahaId: string;
  businessId?: string;
  role?: string; // Role field for mock auth support
}
