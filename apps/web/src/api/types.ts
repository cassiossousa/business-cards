export interface CardProject {
  id: string;
  name: string;
  createdAt: string;
}

export interface CardProjectListResponse {
  projects: CardProject[];
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}
