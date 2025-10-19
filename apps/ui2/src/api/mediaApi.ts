import { baseClient } from "./baseClient";
import { Media } from "@/types/media";

export interface CreateMediaData {
  file: File;
  noteId: string;
}

export const createMedia = async ({ file, noteId }: CreateMediaData): Promise<Media> => {
  const formData = new FormData();
  formData.append("file", file);
  
  const metadata = {
    metadata: {
      noteId,
    }
  };
  formData.append("metadata", JSON.stringify(metadata));
  
  const response = await baseClient.post<Media>('/media', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data;
};

