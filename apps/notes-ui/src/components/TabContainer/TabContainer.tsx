import { useEffect, useRef } from "react";
import { useNoteTabs } from "./useNoteTabs";
import { useGoldenLayout } from "./hooks/useGoldenLayout";
import 'golden-layout/dist/css/goldenlayout-base.css';
import 'golden-layout/dist/css/themes/goldenlayout-dark-theme.css';
import './styles.css';

/**
 * TabContainer - A Golden Layout implementation for note tabs
 * 
 * Features:
 * - Draggable and resizable tabs
 * - Auto-loads notes from noteMap
 * - Persists layout configuration to localStorage
 * - Responsive design with proper error handling
 * - Custom styling that integrates with the app theme
 * - Event handling for tab operations (close, maximize, etc.)
 */

export function TabContainer() {
  const { noteMap } = useNoteTabs();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const noteMapRef = useRef(noteMap);
  
  // Keep noteMapRef current
  useEffect(() => {
    noteMapRef.current = noteMap;
  }, [noteMap]);

  // Use Golden Layout hook for all layout management
  const { 
    isInitialized, 
    initializeLayout, 
    updateLayout, 
    cleanup, 
    handleResize 
  } = useGoldenLayout({
    noteMap,
    noteMapRef,
    containerRef
  });

  // Trigger initialization when notes are available
  useEffect(() => {
    if (noteMap.size > 0 && containerRef.current) {
      initializeLayout();
    }
  }, [noteMap, initializeLayout]);

  // Handle window resize and cleanup
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      // Cleanup is handled by the useGoldenLayout hook
      setTimeout(() => {
        cleanup();
      }, 0);
    };
  }, [handleResize, cleanup]);

  // Track the last noteMap state to avoid unnecessary updates
  const lastNoteMapRef = useRef<Map<string, any>>(new Map());
  
  // Update layout when noteMap changes
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const noteEntries = Array.from(noteMap.entries());
    const currentNoteIds = new Set(noteEntries.map(([noteId]) => noteId));
    const lastNoteIds = new Set(Array.from(lastNoteMapRef.current.keys()));
    
    // Check if there are actual structural changes (new/removed notes)
    const hasStructuralChanges = 
      currentNoteIds.size !== lastNoteIds.size ||
      Array.from(currentNoteIds).some(id => !lastNoteIds.has(id)) ||
      Array.from(lastNoteIds).some(id => !currentNoteIds.has(id));

    if (hasStructuralChanges) {
      // Use setTimeout to avoid synchronous unmounting during render
      const timeoutId = setTimeout(() => {
        updateLayout();
        lastNoteMapRef.current = new Map(noteMapRef.current);
      }, 0);

      return () => clearTimeout(timeoutId);
    } else {
      // Update the ref to track current state
      lastNoteMapRef.current = new Map(noteMapRef.current);
    }
  }, [noteMap, isInitialized, updateLayout]);

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
          height: 'calc(100vh - 120px)', // Account for header and padding
          width: '100%',
          position: 'relative',
          opacity: isInitialized ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out'
        }}
      />
    </div>
  );
}