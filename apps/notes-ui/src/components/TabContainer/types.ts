import { Note } from "@prisma/client";

export interface NoteMapItem {
  note?: Note;
  loaded: boolean;
  loading: boolean;
}

export interface UseGoldenLayoutProps {
  noteMap: Map<string, NoteMapItem>;
  noteMapRef: React.MutableRefObject<Map<string, NoteMapItem>>;
  containerRef: React.RefObject<HTMLDivElement>;
}

export interface UseGoldenLayoutReturn {
  layoutRef: React.MutableRefObject<any>;
  isInitialized: boolean;
  initializeLayout: () => void;
  updateLayout: () => void;
  cleanup: () => void;
  handleResize: () => void;
}