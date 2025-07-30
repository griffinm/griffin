import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot, Root } from 'react-dom/client';
import { GoldenLayout, ComponentContainer } from "golden-layout";
import { createLayoutConfig, saveLayoutConfig } from "../utils/layoutConfig";
import { NoteComponent } from "../components/NoteComponent";
import { UseGoldenLayoutProps, UseGoldenLayoutReturn, NoteMapItem } from "../types";
import { useNotes } from "../../../providers/NoteProvider";
import { NoteUpdateProps } from "../../../utils/api/noteClient";

export function useGoldenLayout({ noteMap, noteMapRef, containerRef }: UseGoldenLayoutProps): UseGoldenLayoutReturn {
  const layoutRef = useRef<GoldenLayout | null>(null);
  const componentRootsRef = useRef<Map<string, Root>>(new Map());
  const [isInitialized, setIsInitialized] = useState(false);
  const { updateNote, deleteNote, setOpenNotes, openNotes } = useNotes();

  // Create note component factory
  const createNoteComponent = useCallback((container: ComponentContainer, componentState: any) => {
    const noteId = componentState?.noteId;
    if (!noteId) return;

    // Create React root for this component
    const element = container.element;
    element.classList.add('h-full', 'w-full');
    const root = createRoot(element);
    componentRootsRef.current.set(noteId, root);
    
    const renderComponent = () => {
      // Get fresh noteMap reference to avoid stale closures
      const currentNoteData = noteMapRef.current.get(noteId);
      
      const handleUpdateNote = async (updatedNote: any) => {
        try {
          const updateData: NoteUpdateProps = {
            id: updatedNote.id,
            content: updatedNote.content,
            title: updatedNote.title
          };
          await updateNote(updateData);
          // The noteMap will be updated through the normal flow, which will trigger re-rendering
        } catch (error) {
          console.error('Failed to update note in tab:', error);
        }
      };

      const handleDeleteNote = (noteIdToDelete: string) => {
        try {
          deleteNote(noteIdToDelete);
          // Remove from openNotes list
          const updatedOpenNotes = openNotes.filter(id => id !== noteIdToDelete);
          setOpenNotes(updatedOpenNotes);
        } catch (error) {
          console.error('Failed to delete note in tab:', error);
        }
      };
      
      root.render(
        <NoteComponent 
          container={container} 
          note={currentNoteData?.note}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleDeleteNote}
        />
      );
    };

    renderComponent();

    // Store render function for updates
    (root as any)._renderComponent = renderComponent;
    (root as any)._container = container;

    // Cleanup when component is destroyed
    container.on('destroy', () => {
      // Use setTimeout to avoid synchronous unmounting during render
      setTimeout(() => {
        root.unmount();
        componentRootsRef.current.delete(noteId);
      }, 0);
    });
  }, [noteMapRef]);

  // Create empty component factory
  const createEmptyComponent = useCallback((container: ComponentContainer) => {
    const element = container.element;
    element.classList.add('h-full', 'w-full', 'flex', 'items-center', 'justify-center', 'text-gray-500');
    element.textContent = 'Open some notes to see them here';
  }, []);

  // Initialize Golden Layout
  const initializeLayout = useCallback(() => {
    if (!containerRef.current || layoutRef.current) {
      return;
    }
    
    try {
      const config = createLayoutConfig(noteMap);
      const layout = new GoldenLayout(containerRef.current);

      // Register component types
      layout.registerComponent('noteComponent', createNoteComponent);
      layout.registerComponent('emptyComponent', createEmptyComponent);

      // Load the configuration
      layout.loadLayout(config);

      // Add event listeners
      layout.on('stateChanged', () => {
        // Save layout state to localStorage for persistence
        if (layoutRef.current) {
          try {
            const config = layoutRef.current.saveLayout();
            saveLayoutConfig(config);
          } catch (error) {
            console.warn('Failed to save layout state:', error);
          }
        }
      });

      layout.on('itemDestroyed', (item: any) => {
        // Handle tab closing
        if (item.componentType === 'noteComponent') {
          const noteId = item.componentState?.noteId;
          if (noteId) {
            // Clean up any resources specific to this note
          }
        }
      });

      // Set layout reference
      layoutRef.current = layout;
      
      // Wait for the layout to be fully initialized before marking as ready
      setTimeout(() => {
        if (layoutRef.current) {
          setIsInitialized(true);
        }
      }, 0);
      
    } catch (error) {
      console.error('TabContainer: Failed to initialize Golden Layout:', error);
      setIsInitialized(false);
    }
  }, [noteMap, createNoteComponent, createEmptyComponent, containerRef]);

  // Update layout when noteMap changes (full reload)
  const updateLayout = useCallback(() => {
    if (!layoutRef.current || !isInitialized) {
      return;
    }

    try {
      // Clear existing components
      componentRootsRef.current.forEach(root => {
        root.unmount();
      });
      componentRootsRef.current.clear();

      // Reload layout with new configuration
      const newConfig = createLayoutConfig(noteMap);
      layoutRef.current.clear();
      layoutRef.current.loadLayout(newConfig);
    } catch (error) {
      console.warn('Error updating layout:', error);
    }
  }, [noteMap, isInitialized]);

  // Refresh existing components without full reload (lighter update)
  const refreshComponents = useCallback(() => {
    if (!isInitialized) {
      return;
    }

    try {
      // Re-render existing components using their stored render functions
      componentRootsRef.current.forEach((root, noteId: string) => {
        const renderFunction = (root as any)._renderComponent;
        if (renderFunction && typeof renderFunction === 'function') {
          renderFunction();
        }
      });
    } catch (error) {
      console.warn('Error refreshing components:', error);
    }
  }, [isInitialized]);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Clean up all React roots
    componentRootsRef.current.forEach(root => {
      root.unmount();
    });
    componentRootsRef.current.clear();
    
    if (layoutRef.current) {
      try {
        layoutRef.current.destroy();
      } catch (error) {
        console.warn('Error destroying layout:', error);
      }
      layoutRef.current = null;
    }
    setIsInitialized(false);
  }, []);

  // Handle window resize
  const handleResize = useCallback(() => {
    if (layoutRef.current && containerRef.current) {
      layoutRef.current.updateSize(containerRef.current.offsetWidth, containerRef.current.offsetHeight);
    }
  }, [containerRef]);

  return {
    layoutRef,
    isInitialized,
    initializeLayout,
    updateLayout,
    refreshComponents,
    cleanup,
    handleResize
  };
}