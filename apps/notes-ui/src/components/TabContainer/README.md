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
Individual note display component that:
- Renders note content with proper styling
- Shows loading states for notes being fetched
- Updates tab titles dynamically
- Handles empty note states

## Hooks

### `useNoteTabs`
Manages note data state:
- Fetches note content from API
- Tracks loading states for each note
- Synchronizes with the global notes provider
- Returns a Map of note data keyed by note ID

### `useGoldenLayout`
Handles Golden Layout lifecycle:
- Initializes and configures Golden Layout
- Manages React root creation for components
- Handles layout updates and cleanup
- Provides resize handling
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

- **Modular Architecture**: Each concern separated into focused modules
- **Type Safety**: Full TypeScript support with shared interfaces
- **Performance**: Efficient updates and proper cleanup
- **Persistence**: Layout state saved to localStorage
- **Responsive**: Handles window resize events
- **Error Handling**: Graceful error boundaries and fallbacks

## Styling

The component uses:
- Golden Layout's built-in CSS
- Custom CSS in `styles.css` for theme integration
- Tailwind CSS classes for modern styling
- Responsive design principles