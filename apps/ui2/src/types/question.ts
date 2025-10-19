export interface Question {
  id: string;
  userId: string;
  noteId: string;
  question: string;
  answer?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

