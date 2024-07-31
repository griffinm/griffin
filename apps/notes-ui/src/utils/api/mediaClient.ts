import { Axios, AxiosResponse } from "axios";
import { baseClient } from "./baseClient";
import { Media } from "@prisma/client";

interface CreateMediaProps {
  file: File,
  noteId: string,
}

export const createMedia = async({
  file,
  noteId, 
}: CreateMediaProps): Promise<AxiosResponse<Media>> => {
  const formData = new FormData()
  formData.append("file", file)
  const metaData = {
    metadata: {
      noteId,
    }
  }
  formData.append("metadata", JSON.stringify(metaData))
  
  return baseClient.post('/media', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}