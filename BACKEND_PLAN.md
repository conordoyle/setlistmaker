# Backend Architecture Plan for Real-time Setlist Manager

## Overview
This plan outlines the backend implementation to enable real-time synchronization between users, allowing multiple people to collaborate on the same setlist simultaneously.

## 1. Technology Stack
- **Backend**: Node.js + Express.js (deployed on Railway)
- **Database**: PostgreSQL (Railway's managed PostgreSQL)
- **Real-time**: Socket.io for live updates
- **Authentication**: Simple session-based or JWT tokens

## 2. Core Features
- **Setlist Management**: Create, read, update, delete setlists
- **Real-time Sync**: Live updates when anyone changes the setlist
- **Sharing**: Generate unique URLs for each setlist
- **Collaboration**: Multiple users can edit the same setlist simultaneously

## 3. Database Schema
```sql
-- Setlists table
setlists (
  id: UUID (primary key)
  title: VARCHAR
  date: DATE
  logo_url: TEXT
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
)

-- Songs table  
songs (
  id: UUID (primary key)
  setlist_id: UUID (foreign key)
  title: VARCHAR
  position: INTEGER
  created_at: TIMESTAMP
)

-- Users table (optional for future features)
users (
  id: UUID (primary key)
  name: VARCHAR
  created_at: TIMESTAMP
)
```

## 4. API Endpoints
```
POST   /api/setlists          - Create new setlist
GET    /api/setlists/:id      - Get setlist by ID
PUT    /api/setlists/:id      - Update setlist
DELETE /api/setlists/:id      - Delete setlist

POST   /api/setlists/:id/songs     - Add song
PUT    /api/setlists/:id/songs/:songId  - Update song
DELETE /api/setlists/:id/songs/:songId  - Delete song
PUT    /api/setlists/:id/songs/reorder - Reorder songs
```

## 5. Real-time Events (Socket.io)
- `setlist:updated` - When setlist metadata changes
- `song:added` - When new song is added
- `song:updated` - When song title changes
- `song:deleted` - When song is removed
- `songs:reordered` - When song order changes

## 6. Frontend Changes Needed
- Replace localStorage with API calls
- Add Socket.io client for real-time updates
- Add setlist sharing functionality
- Add loading states and error handling

## 7. Deployment Flow
1. **Backend**: Deploy Node.js API to Railway
2. **Database**: Set up PostgreSQL on Railway
3. **Frontend**: Update to use backend API
4. **Environment**: Configure CORS and environment variables

## 8. User Experience
- **Create Setlist**: User gets unique URL to share
- **Share Setlist**: Copy/paste URL to collaborate
- **Real-time Updates**: See changes as they happen
- **Offline Support**: Fallback to localStorage if backend unavailable

## 9. Implementation Priority
1. **Phase 1**: Basic CRUD API + database
2. **Phase 2**: Real-time updates with Socket.io
3. **Phase 3**: User authentication + multiple setlists
4. **Phase 4**: Advanced features (templates, history, etc.)

## 10. Benefits
- **Real-time Collaboration**: Multiple users can edit simultaneously
- **Data Persistence**: Setlists saved in database, not just browser
- **Sharing**: Easy to share setlists with band members
- **Scalability**: Can handle multiple setlists and users
- **Reliability**: Data backed up and accessible from anywhere

## 11. Technical Considerations
- **CORS Configuration**: Allow frontend domain to access API
- **Rate Limiting**: Prevent abuse of API endpoints
- **Error Handling**: Graceful fallbacks and user feedback
- **Performance**: Efficient database queries and real-time updates
- **Security**: Input validation and sanitization
