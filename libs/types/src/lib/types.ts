<<<<<<< Updated upstream
import { Request } from '@nestjs/common';
=======
import { Request } from 'express';
>>>>>>> Stashed changes
import { User } from '@prisma/client';

export interface RequestWithUser extends Request {
  user: User;
}

export type CompletedFilterOptions = 'OnlyCompleted' | 'OnlyNotCompleted' | 'All';

export const PriorityOptions: Record<string, string> = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  NONE: '',
} as const;
export type PriorityOptionType = typeof PriorityOptions[keyof typeof PriorityOptions];


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
