# Setlist Manager Frontend

This is the frontend application for the Setlist Manager, featuring real-time collaboration and setlist management.

## Features

- **Global Setlist Management**: All users see the same setlists
- **Setlist Dropdown**: Switch between different setlists
- **Create New Setlists**: Choose between blank or copy existing
- **Remove Setlists**: Delete setlists with confirmation
- **Real-time Updates**: See changes as they happen via Socket.io
- **Drag & Drop**: Reorder songs with drag and drop
- **PDF Export**: Print-friendly layout

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory:
   ```
   VITE_API_URL=http://localhost:3000
   ```

3. Make sure the backend server is running (see backend README)

## Running the Frontend

Development mode:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

## Backend Integration

The frontend connects to the backend API for:
- Loading and managing setlists
- CRUD operations on songs
- Real-time updates via Socket.io

## Environment Variables

- `VITE_API_URL`: URL of the backend API server

## Real-time Features

The application uses Socket.io for real-time updates:
- Setlist creation, updates, and removal
- Song addition, updates, deletion, and reordering
- Automatic synchronization across all connected users
