# Backend Architecture Plan for Real-time Setlist Manager

## Overview
This plan outlines the backend implementation to enable real-time synchronization between users, allowing multiple people to collaborate on the same setlist simultaneously. The system will feature a global setlist management approach where all users see the same setlists and can switch between them via a dropdown interface.

## 1. Technology Stack
- **Backend**: Node.js + Express.js (deployed on Railway)
- **Database**: PostgreSQL (Neon's serverless PostgreSQL)
- **Real-time**: Socket.io for live updates
- **Authentication**: None required - open access for all users

## 2. Core Features
- **Global Setlist Management**: All users see the same setlists by default
- **Setlist Selector**: Dropdown in top-right corner to switch between setlists
- **Setlist Operations**: Create new setlists (blank or copy existing), remove setlists
- **Real-time Sync**: Live updates when anyone changes any setlist
- **Collaboration**: Multiple users can edit the same setlist simultaneously

## 3. Database Schema
```sql
-- Setlists table
setlists (
  id: UUID (primary key)
  title: VARCHAR
  date: DATE
  logo_url: TEXT
  is_active: BOOLEAN (default: true)
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
```

## 4. API Endpoints
```
# Setlist Management
GET    /api/setlists          - Get all active setlists (for dropdown)
POST   /api/setlists          - Create new setlist (blank or copy)
PUT    /api/setlists/:id      - Update setlist
DELETE /api/setlists/:id      - Remove setlist (soft delete)

# Setlist Content
GET    /api/setlists/:id      - Get setlist by ID with songs
POST   /api/setlists/:id/songs     - Add song
PUT    /api/setlists/:id/songs/:songId  - Update song
DELETE /api/setlists/:id/songs/:songId  - Delete song
PUT    /api/setlists/:id/songs/reorder - Reorder songs

# Setlist Copy Operation
POST   /api/setlists/:id/copy - Create copy of existing setlist
```

## 5. Real-time Events (Socket.io)
- `setlist:created` - When new setlist is added
- `setlist:updated` - When setlist metadata changes
- `setlist:removed` - When setlist is removed
- `song:added` - When new song is added
- `song:updated` - When song title changes
- `song:deleted` - When song is removed
- `songs:reordered` - When song order changes

## 6. Frontend Changes Needed
- **Global State**: Replace localStorage with API calls for setlist management
- **Dropdown Component**: Add setlist selector in top-right corner
- **Setlist Operations**: Add "New Setlist" and "Remove Setlist" options in dropdown
- **Copy Functionality**: Allow users to choose between blank or copy existing setlist
- **Socket.io Client**: Add for real-time updates across all setlists
- **Loading States**: Add loading states and error handling
- **Active Setlist**: Track currently selected setlist in global state

## 7. User Experience Flow
- **Landing**: All users see the same default/active setlist
- **Setlist Selection**: Dropdown shows all available setlists
- **Create New**: 
  - Option 1: "Blank Setlist" - creates empty setlist
  - Option 2: "Copy [Setlist Name]" - creates duplicate with all songs
- **Remove Setlist**: Confirmation dialog before removal
- **Real-time Updates**: Changes to any setlist appear immediately for all users
- **Persistence**: All setlists saved in database, accessible from anywhere

## 8. Deployment Flow
1. **Backend**: Deploy Node.js API to Railway
2. **Database**: Set up PostgreSQL on Neon
3. **Frontend**: Update to use backend API and add setlist management UI
4. **Environment**: Configure CORS and environment variables

## 9. Implementation Priority
1. **Phase 1**: Basic CRUD API + database + global setlist system
2. **Phase 2**: Setlist dropdown selector and management operations
3. **Phase 3**: Real-time updates with Socket.io
4. **Phase 4**: Advanced features (templates, history, etc.)

## 10. Benefits
- **Unified Experience**: All users see the same setlists by default
- **Easy Management**: Simple dropdown interface for setlist operations
- **Flexible Creation**: Choose between blank or copy existing setlist
- **Real-time Collaboration**: Multiple users can edit simultaneously
- **Data Persistence**: Setlists saved in database, not just browser
- **Scalability**: Can handle multiple setlists and users
- **Reliability**: Data backed up and accessible from anywhere

## 11. Technical Considerations
- **CORS Configuration**: Allow frontend domain to access API
- **Rate Limiting**: Prevent abuse of API endpoints
- **Error Handling**: Graceful fallbacks and user feedback
- **Performance**: Efficient database queries and real-time updates
- **Security**: Input validation and sanitization
- **Soft Deletes**: Use is_active flag instead of hard deletion
- **Copy Logic**: Deep copy songs when duplicating setlists
- **Default Setlist**: Always maintain at least one active setlist
