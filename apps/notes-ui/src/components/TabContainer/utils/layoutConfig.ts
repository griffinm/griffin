import { Config, ComponentItemConfig } from "golden-layout";
import { NoteMapItem } from "../types";

/**
 * Creates a Golden Layout configuration from a note map
 */
export function createLayoutConfig(noteMap: Map<string, NoteMapItem>): Config {
  const noteEntries = Array.from(noteMap.entries());
  
  if (noteEntries.length === 0) {
    return createEmptyLayoutConfig();
  }

  return createNotesLayoutConfig(noteEntries);
}

/**
 * Creates an empty layout configuration with placeholder content
 */
function createEmptyLayoutConfig(): Config {
  return {
    root: {
      type: 'row',
      content: [{
        type: 'stack',
        content: [{
          type: 'component',
          componentType: 'emptyComponent',
          title: 'No Notes Open'
        }]
      }]
    },
    settings: {
      hasHeaders: true,
      constrainDragToContainer: true,
      reorderEnabled: true,
      popoutWholeStack: false,
      blockedPopoutsThrowError: true,
      closePopoutsOnUnload: true,
      showPopoutIcon: false,
      showMaximiseIcon: true,
      showCloseIcon: true
    }
  };
}

/**
 * Creates a layout configuration with note tabs
 */
function createNotesLayoutConfig(noteEntries: Array<[string, NoteMapItem]>): Config {
  const noteComponents: ComponentItemConfig[] = noteEntries.map(([noteId, noteData]) => ({
    type: 'component',
    componentType: 'noteComponent',
    title: noteData.note?.title || 'Loading...',
    componentState: { noteId }
  }));

  return {
    root: {
      type: 'row',
      content: [{
        type: 'stack',
        content: noteComponents
      }]
    },
    settings: {
      hasHeaders: true,
      constrainDragToContainer: true,
      reorderEnabled: true,
      popoutWholeStack: false,
      blockedPopoutsThrowError: true,
      closePopoutsOnUnload: true,
      showPopoutIcon: false,
      showMaximiseIcon: true,
      showCloseIcon: true
    }
  };
}

/**
 * Loads a saved layout configuration from localStorage
 */
export function loadSavedLayoutConfig(): Config | null {
  try {
    const saved = localStorage.getItem('notesLayout');
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn('Failed to load saved layout configuration:', error);
    return null;
  }
}

/**
 * Saves a layout configuration to localStorage
 */
export function saveLayoutConfig(config: any): void {
  try {
    localStorage.setItem('notesLayout', JSON.stringify(config));
  } catch (error) {
    console.warn('Failed to save layout configuration:', error);
  }
}