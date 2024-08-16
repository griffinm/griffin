import { Request } from '@nestjs/common';
import { User } from '@prisma/client';
export interface RequestWithUser extends Request {
  user: User;
}

export interface SignInResponse {
  jwt: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface CreateUserResponse extends User {
  jwt: string;
}

export interface SearchResult {
  noteId: string;
  noteTitle: string;
  notebookTitle: string;
  notebookId: string;
  tsRank: number;
  trigramSimilarity: number;
}

export interface SearchResultQueryResult {
  note_id: string;
  note_title: string;
  notebook_title: string;
  notebook_id: string;
  ts_rank: number;
  trigram_similarity: number;
}