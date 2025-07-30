import { useNotes } from "../../providers/NoteProvider";
import { useEffect, useState, useCallback } from "react";
import { fetchNote } from "../../utils/api";
import { NoteMapItem } from "./types";

interface State {
  noteMap: Map<string, NoteMapItem>;
}

export function useNoteTabs(): State {
  const [state, setState] = useState<State>({
    noteMap: new Map(),
  });
  const { openNotes: openNoteIds, notes } = useNotes();

  const loadNote = useCallback(async (noteId: string) => {
    // Set loading state
    setState((prev) => {
      const newNoteMap = new Map(prev.noteMap);
      const existingItem = newNoteMap.get(noteId);
      newNoteMap.set(noteId, {
        note: undefined,
        loaded: false,
        ...existingItem,
        loading: true,
      });
      return {
        ...prev,
        noteMap: newNoteMap,
      };
    });

    try {
      const response = await fetchNote(noteId);
      const note = response.data;

      // Update with loaded note
      setState((prev) => {
        const newNoteMap = new Map(prev.noteMap);
        newNoteMap.set(noteId, {
          note,
          loaded: true,
          loading: false,
        });
        return {
          ...prev,
          noteMap: newNoteMap,
        };
      });
    } catch (error) {
      console.error(`Failed to load note ${noteId}:`, error);
      
      // Update with error state
      setState((prev) => {
        const newNoteMap = new Map(prev.noteMap);
        newNoteMap.set(noteId, {
          note: undefined,
          loaded: false,
          loading: false,
        });
        return {
          ...prev,
          noteMap: newNoteMap,
        };
      });
    }
  }, []);

  useEffect(() => {
    setState((prev) => {
      const newNoteMap = new Map(prev.noteMap);
      const newlyAddedNotes: string[] = [];
      
      // Add any new IDs that aren't in the map yet
      openNoteIds.forEach((id) => {
        if (!newNoteMap.has(id)) {
          newNoteMap.set(id, {
            note: undefined,
            loaded: false,
            loading: false
          });
          newlyAddedNotes.push(id);
        }
      });

      // Remove any IDs that are no longer open
      for (const [id] of newNoteMap) {
        if (!openNoteIds.includes(id)) {
          newNoteMap.delete(id);
        }
      }
      
      // Load newly added notes
      newlyAddedNotes.forEach((noteId) => {
        loadNote(noteId);
      });

      return {
        ...prev,
        noteMap: newNoteMap
      };
    });
  }, [openNoteIds, loadNote]);

  // Sync with provider's notes array when notes are updated
  useEffect(() => {
    if (notes.length === 0) return;
    
    setState((prev) => {
      const newNoteMap = new Map(prev.noteMap);
      let hasChanges = false;
      
      // Update any notes that exist in both the provider and our noteMap
      for (const [noteId, noteMapItem] of newNoteMap) {
        const providerNote = notes.find(n => n.id === noteId);
        if (providerNote && noteMapItem.note) {
          // Check if the provider note is different from our cached note
          if (providerNote.content !== noteMapItem.note.content || 
              providerNote.title !== noteMapItem.note.title ||
              providerNote.updatedAt !== noteMapItem.note.updatedAt) {
            newNoteMap.set(noteId, {
              ...noteMapItem,
              note: providerNote
            });
            hasChanges = true;
          }
        }
      }
      
      return hasChanges ? { ...prev, noteMap: newNoteMap } : prev;
    });
  }, [notes]);

  return state;
}