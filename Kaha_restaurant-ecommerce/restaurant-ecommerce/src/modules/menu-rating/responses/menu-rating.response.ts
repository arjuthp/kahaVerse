export class MenuResponse {
  name?: string;
  description?: string;
}

export class IMenuRatingResponse {
  id: string;
  rating: number;
  comments: string;
  ratedBy: string;
  businessId: string;
  menu?: MenuResponse;
}
