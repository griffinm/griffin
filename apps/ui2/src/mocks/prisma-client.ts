// Mock for @prisma/client to prevent import errors in frontend
export interface User {
  id: string;
  email: string;
  name?: string | null;
  [key: string]: any;
}

