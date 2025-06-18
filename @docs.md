# Bucket - Todo List Application

## Overview

**Bucket** is a modern, Progressive Web Application (PWA) built with React and TypeScript for managing todo lists and tasks. The application features a visually appealing interface with drag-and-drop functionality, real-time synchronization, and offline capabilities.

## Project Structure

```
bucket/
├── src/
│   ├── components/        # Reusable UI components
│   ├── lib/              # Utility libraries
│   ├── App.tsx           # Main application component
│   ├── Screen.tsx        # Todo list container component
│   ├── Task.tsx          # Individual task component
│   ├── Adder.tsx         # Add new task component
│   ├── store.ts          # Database configuration and models
│   ├── emojis.tsx        # Emoji utilities
│   └── main.tsx          # Application entry point
├── public/               # Static assets
├── @types/              # TypeScript type definitions
└── Configuration files
```

## Technology Stack

### Core Technologies
- **React 18.3.1** - UI library with hooks and functional components
- **TypeScript 5.5.4** - Type-safe JavaScript
- **Vite 5.4.2** - Build tool and development server
- **Tailwind CSS 3.4.10** - Utility-first CSS framework

### Database & State Management
- **Dexie 4.0.8** - IndexedDB wrapper for client-side storage
- **Dexie Cloud Addon 4.0.8** - Real-time synchronization capabilities
- **Dexie React Hooks 1.1.7** - React integration for Dexie

### UI Components & Animation
- **Radix UI** - Accessible, unstyled UI components
  - Dialog, Progress, Slider, Slot components
- **Framer Motion 11.3.30** - Animation library
- **Magic Grid 3.4.7** - Masonry-style grid layout
- **Class Variance Authority** - Component variant management

### Utilities
- **Ramda 0.29.1** - Functional programming utilities
- **Wouter 3.3.4** - Minimalist routing
- **RandomColor 0.6.2** - Color generation
- **@uidotdev/usehooks 2.4.1** - React hooks collection

### PWA Features
- **Vite PWA Plugin 0.17.5** - Progressive Web App capabilities
- **Workbox** - Service worker management for offline functionality

## Key Features

### 1. Multi-List Management
- Create multiple todo lists with custom names
- Each list has a unique emoji identifier
- Color-coded lists with random theme colors
- Masonry grid layout for optimal space utilization

### 2. Task Management
- Add tasks with titles and descriptions
- Progress tracking with visual progress bars
- Long-press interactions for bulk progress updates
- Task completion with automatic deletion
- Real-time task status updates

### 3. Visual Interface
- Dark theme with glassmorphism effects
- Responsive design for mobile and desktop
- Smooth animations and transitions
- Emoji-based visual identifiers
- Dynamic color generation per list

### 4. Data Persistence
- IndexedDB for local storage
- Real-time cloud synchronization via Dexie Cloud
- Offline-first architecture
- Automatic conflict resolution

### 5. Cemetery Feature
- Deleted tasks are moved to a "cemetery" view
- Preserves task history
- Accessible via dedicated route (`/cemetery`)

### 6. PWA Capabilities
- Installable as a native app
- Offline functionality
- Service worker for caching
- App-like experience on mobile devices

## Data Models

### TodoList
```typescript
interface TodoList {
  id?: number;
  title: string;
  emoji?: string;
}
```

### TodoItem
```typescript
interface TodoItem {
  id?: number;
  title: string;
  progress: number;
  description?: string;
  todoListId: number;
}
```

## Database Configuration

The application uses Dexie with cloud synchronization:

```typescript
class TodoDB extends Dexie {
  todoLists!: Table<TodoList, number>;
  todoItems!: Table<TodoItem, number>;
  cemetery!: Table<TodoItem, number>;
}
```

Cloud configuration enables real-time synchronization:
- Database URL: `https://zrse37s6n.dexie.cloud`
- Authentication required for sync features

## Development

### Prerequisites
- Node.js 20.11.0 (managed via Volta)
- pnpm 9.6.0+ (package manager)

### Available Scripts
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build

### Development Server
- Port: 4000
- Hot module replacement enabled
- PostCSS and Tailwind CSS processing

## Build Configuration

### Vite Configuration
- Target: Safari 11+ for broad compatibility
- Million.js optimization for React performance
- PWA configuration with service worker
- Path aliases for clean imports

### PWA Manifest
- App name: "Bucket"
- Theme: Dark (#000000)
- Icons: 192x192 and 512x512 PNG formats
- Offline capabilities with service worker

## User Experience

### Navigation
- Main view: Todo lists in masonry grid
- Cemetery view: Deleted tasks archive
- Floating action buttons for quick actions

### Interactions
- Click to edit list names and task titles
- Long-press tasks for rapid progress updates
- Drag and drop (via Magic Grid layout)
- Modal dialogs for detailed task editing

### Visual Design
- Dark theme with high contrast
- Random color generation for list theming
- Smooth animations and micro-interactions
- Mobile-first responsive design

## Performance Optimizations

### React Optimizations
- Million.js compiler for enhanced performance
- Memo components to prevent unnecessary re-renders
- Efficient re-rendering with Dexie live queries

### Build Optimizations
- Code splitting with Vite
- Asset optimization and minification
- Service worker caching strategies
- Lazy loading for route components

## Future Enhancements

The application is designed to be extensible with potential features:
- Real-time collaboration between users
- Advanced task filtering and sorting
- Task categories and tags
- Due dates and reminders
- Export/import functionality
- Theme customization options

## Browser Support

- Modern browsers with IndexedDB support
- PWA features require service worker support
- Optimized for mobile Safari and Chrome
- Graceful degradation for older browsers