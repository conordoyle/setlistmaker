import express from 'express';
import { pool } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all active setlists (for dropdown)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, date, logo_url, created_at, updated_at FROM setlists WHERE is_active = true ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching setlists:', err);
    res.status(500).json({ error: 'Failed to fetch setlists' });
  }
});

// Get setlist by ID with songs
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get setlist details
    const setlistResult = await pool.query(
      'SELECT id, title, date, logo_url, created_at, updated_at FROM setlists WHERE id = $1 AND is_active = true',
      [id]
    );
    
    if (setlistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Setlist not found' });
    }
    
    // Get songs for this setlist
    const songsResult = await pool.query(
      'SELECT id, title, position FROM songs WHERE setlist_id = $1 ORDER BY position ASC',
      [id]
    );
    
    const setlist = setlistResult.rows[0];
    setlist.songs = songsResult.rows;
    
    res.json(setlist);
  } catch (err) {
    console.error('Error fetching setlist:', err);
    res.status(500).json({ error: 'Failed to fetch setlist' });
  }
});

// Create new setlist (blank)
router.post('/', async (req, res) => {
  try {
    const { title, date, logo_url } = req.body;
    const id = uuidv4();
    
    const result = await pool.query(
      'INSERT INTO setlists (id, title, date, logo_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, title || 'New Setlist', date, logo_url]
    );
    
    const newSetlist = result.rows[0];
    
    // Emit real-time update
    const io = req.app.get('io');
    io.emit('setlist:created', newSetlist);
    
    res.status(201).json(newSetlist);
  } catch (err) {
    console.error('Error creating setlist:', err);
    res.status(500).json({ error: 'Failed to create setlist' });
  }
});

// Copy existing setlist
router.post('/:id/copy', async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    
    // Get original setlist
    const setlistResult = await pool.query(
      'SELECT * FROM setlists WHERE id = $1 AND is_active = true',
      [id]
    );
    
    if (setlistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Setlist not found' });
    }
    
    const originalSetlist = setlistResult.rows[0];
    
    // Create new setlist
    const newSetlistId = uuidv4();
    const newTitle = title || `${originalSetlist.title} (Copy)`;
    
    await pool.query(
      'INSERT INTO setlists (id, title, date, logo_url) VALUES ($1, $2, $3, $4)',
      [newSetlistId, newTitle, originalSetlist.date, originalSetlist.logo_url]
    );
    
    // Copy songs
    const songsResult = await pool.query(
      'SELECT title, position FROM songs WHERE setlist_id = $1 ORDER BY position ASC',
      [id]
    );
    
    for (const song of songsResult.rows) {
      await pool.query(
        'INSERT INTO songs (setlist_id, title, position) VALUES ($1, $2, $3)',
        [newSetlistId, song.title, song.position]
      );
    }
    
    // Get the new setlist with songs
    const newSetlistResult = await pool.query(
      'SELECT id, title, date, logo_url, created_at, updated_at FROM setlists WHERE id = $1',
      [newSetlistId]
    );
    
    const newSetlist = newSetlistResult.rows[0];
    newSetlist.songs = songsResult.rows;
    
    // Emit real-time update
    const io = req.app.get('io');
    io.emit('setlist:created', newSetlist);
    
    res.status(201).json(newSetlist);
  } catch (err) {
    console.error('Error copying setlist:', err);
    res.status(500).json({ error: 'Failed to copy setlist' });
  }
});

// Update setlist
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, logo_url } = req.body;
    
    const result = await pool.query(
      'UPDATE setlists SET title = COALESCE($1, title), date = COALESCE($2, date), logo_url = COALESCE($3, logo_url) WHERE id = $4 AND is_active = true RETURNING *',
      [title, date, logo_url, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setlist not found' });
    }
    
    const updatedSetlist = result.rows[0];
    
    // Emit real-time update
    const io = req.app.get('io');
    io.to(`setlist-${id}`).emit('setlist:updated', updatedSetlist);
    
    res.json(updatedSetlist);
  } catch (err) {
    console.error('Error updating setlist:', err);
    res.status(500).json({ error: 'Failed to update setlist' });
  }
});

// Remove setlist (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if this is the last active setlist
    const activeCountResult = await pool.query(
      'SELECT COUNT(*) FROM setlists WHERE is_active = true'
    );
    
    if (parseInt(activeCountResult.rows[0].count) <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last setlist' });
    }
    
    const result = await pool.query(
      'UPDATE setlists SET is_active = false WHERE id = $1 AND is_active = true RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setlist not found' });
    }
    
    // Emit real-time update
    const io = req.app.get('io');
    io.emit('setlist:removed', { id });
    
    res.json({ message: 'Setlist removed successfully' });
  } catch (err) {
    console.error('Error removing setlist:', err);
    res.status(500).json({ error: 'Failed to remove setlist' });
  }
});

export default router;
