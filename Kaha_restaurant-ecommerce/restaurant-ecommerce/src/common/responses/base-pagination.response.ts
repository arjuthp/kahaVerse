export class IBasePaginationResponse {
  metaData: {
    currentPage: number;
    perPage: number;
    totalPages: number;
    totalCount: number;
  };
}
