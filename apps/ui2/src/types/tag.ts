export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  userId: string;
}

