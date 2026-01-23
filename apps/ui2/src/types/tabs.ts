export interface Tab {
  noteId: string;
  title: string;
  addedAt: number;
}

export interface TabsState {
  tabs: Tab[];
  activeTabId: string | null;
}
