import { useEffect, useRef } from "react";
import { useNoteTabs } from "./useNoteTabs";
import { useGoldenLayout } from "./hooks/useGoldenLayout";
import 'golden-layout/dist/css/goldenlayout-base.css';
import 'golden-layout/dist/css/themes/goldenlayout-dark-theme.css';
import './styles.css';

export function TabContainer() {
  const { noteMap } = useNoteTabs();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const noteMapRef = useRef(noteMap);

  useEffect(() => {
    noteMapRef.current = noteMap;
  }, [noteMap]);

  const { 
    isInitialized, 
    initializeLayout, 
    updateLayout, 
    refreshComponents, 
    cleanup, 
    handleResize 
  } = useGoldenLayout({
    noteMap,
    noteMapRef,
    containerRef
  });

  useEffect(() => {
    if (noteMap.size > 0 && containerRef.current) {
      initializeLayout();
    }
  }, [noteMap, initializeLayout]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      setTimeout(() => {
        cleanup();
      }, 0);
    };
  }, [handleResize, cleanup]);

  const lastNoteMapRef = useRef<Map<string, any>>(new Map());
  
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const noteEntries = Array.from(noteMap.entries());
    const currentNoteIds = new Set(noteEntries.map(([noteId]) => noteId));
    const lastNoteIds = new Set(Array.from(lastNoteMapRef.current.keys()));
    
    const hasStructuralChanges = 
      currentNoteIds.size !== lastNoteIds.size ||
      Array.from(currentNoteIds).some(id => !lastNoteIds.has(id)) ||
      Array.from(lastNoteIds).some(id => !currentNoteIds.has(id));

    if (hasStructuralChanges) {
      const timeoutId = setTimeout(() => {
        updateLayout();
        lastNoteMapRef.current = new Map(noteMapRef.current);
      }, 0);

      return () => clearTimeout(timeoutId);
    } else {
      // No structural changes, but note content might have changed
      // Check if any notes finished loading and trigger re-render
      let needsRerender = false;
      for (const [noteId, noteData] of noteMap) {
        const lastNoteData = lastNoteMapRef.current.get(noteId);
        if (lastNoteData) {
          // Check if note finished loading or content changed
          if (noteData.loaded !== lastNoteData.loaded ||
              (noteData.loaded && noteData.note?.content !== lastNoteData.note?.content) ||
              (noteData.loaded && noteData.note?.title !== lastNoteData.note?.title)) {
            needsRerender = true;
            break;
          }
        }
      }
      
      if (needsRerender) {
        const timeoutId = setTimeout(() => {
          // Use lighter refresh instead of full updateLayout for content changes
          refreshComponents();
          lastNoteMapRef.current = new Map(noteMapRef.current);
        }, 0);
        return () => clearTimeout(timeoutId);
      } else {
        // Update the ref to track current state
        lastNoteMapRef.current = new Map(noteMapRef.current);
      }
    }
  }, [noteMap, isInitialized, updateLayout, refreshComponents]);

  return (
    <div className="tab-container-wrapper">
      {!isInitialized && (
        <div className="h-full w-full flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading layout...</div>
          </div>
        </div>
      )}
      <div 
        ref={containerRef} 
        className="h-full w-full"
        style={{ 
          minHeight: '400px',
          height: '100vh',
          width: '100%',
          position: 'relative',
          opacity: isInitialized ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out'
        }}
      />
    </div>
  );
}