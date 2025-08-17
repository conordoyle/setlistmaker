# Setlist Manager Backend

This is the backend API for the Setlist Manager application, providing real-time synchronization for collaborative setlist management.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the backend directory with the following variables:
   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   PORT=3000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

3. Set up your Neon PostgreSQL database and run the schema:
   ```bash
   psql $DATABASE_URL -f src/db/schema.sql
   ```

## Running the Server

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Setlists
- `GET /api/setlists` - Get all active setlists
- `GET /api/setlists/:id` - Get setlist by ID with songs
- `POST /api/setlists` - Create new setlist
- `POST /api/setlists/:id/copy` - Copy existing setlist
- `PUT /api/setlists/:id` - Update setlist
- `DELETE /api/setlists/:id` - Remove setlist (soft delete)

### Songs
- `POST /api/setlists/:setlistId/songs` - Add song to setlist
- `PUT /api/setlists/:setlistId/songs/:songId` - Update song
- `DELETE /api/setlists/:setlistId/songs/:songId` - Delete song
- `PUT /api/setlists/:setlistId/songs/reorder` - Reorder songs

## Real-time Updates

The server uses Socket.io to provide real-time updates for:
- Setlist creation, updates, and removal
- Song addition, updates, deletion, and reordering

## Database Schema

The application uses PostgreSQL with the following main tables:
- `setlists` - Setlist metadata and configuration
- `songs` - Songs within setlists with positions
