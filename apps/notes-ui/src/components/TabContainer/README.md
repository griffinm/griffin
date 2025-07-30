# TabContainer Component

A modular, Golden Layout-based tab container for displaying notes with drag-and-drop functionality.

## Structure

```
TabContainer/
├── components/
│   └── NoteComponent.tsx          # Individual note display component
├── hooks/
│   └── useGoldenLayout.tsx        # Golden Layout lifecycle management
├── utils/
│   └── layoutConfig.ts            # Layout configuration utilities
├── TabContainer.tsx               # Main container component
├── useNoteTabs.ts                # Note data management hook
├── types.ts                      # TypeScript interfaces
├── styles.css                    # Custom CSS styles
└── index.ts                      # Public exports
```

## Components

### `TabContainer`
The main orchestrating component that:
- Manages the Golden Layout container
- Handles initialization and updates
- Provides loading states
- Coordinates between note data and layout

### `NoteComponent`
Individual note display wrapper that:
- Renders the full `Note.tsx` component with editor functionality
- Shows loading states for notes being fetched
- Updates tab titles dynamically
- Provides note update and delete capabilities
- Integrates with the global note provider for data consistency

## Hooks

### `useNoteTabs`
Manages note data state:
- Fetches note content from API
- Tracks loading states for each note
- Synchronizes with the global notes provider
- Syncs tab data with provider updates for consistency
- Returns a Map of note data keyed by note ID

### `useGoldenLayout`
Handles Golden Layout lifecycle:
- Initializes and configures Golden Layout
- Manages React root creation for components
- Handles layout updates and cleanup
- Provides resize handling
- Integrates with note provider for update/delete operations
- Returns control functions and state

## Utilities

### `layoutConfig.ts`
Configuration utilities:
- `createLayoutConfig()` - Creates layout config from note map
- `loadSavedLayoutConfig()` - Loads saved layout from localStorage
- `saveLayoutConfig()` - Saves layout to localStorage
- Helper functions for empty and notes layouts

## Usage

```tsx
import { TabContainer } from './components/TabContainer';

// Simple usage - component handles everything internally
<TabContainer />
```

## Features

- **Full Note Editing**: Uses the complete `Note.tsx` component with rich text editor
- **Real-time Updates**: Changes sync across tabs and main app interface with automatic re-rendering
- **Note Management**: Full CRUD operations (create, read, update, delete) within tabs
- **Modular Architecture**: Each concern separated into focused modules
- **Type Safety**: Full TypeScript support with shared interfaces
- **Performance**: Efficient updates and proper cleanup
- **Persistence**: Layout state saved to localStorage
- **Responsive**: Handles window resize events
- **Error Handling**: Graceful error boundaries and fallbacks
- **Provider Integration**: Seamless sync with global note state

## Styling

The component uses:
- Golden Layout's built-in CSS
- Custom CSS in `styles.css` for theme integration
- Tailwind CSS classes for modern styling
- Responsive design principles