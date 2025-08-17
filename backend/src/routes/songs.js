import express from 'express';
import { pool } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Reorder songs - MUST come before individual song routes to avoid UUID conflict
router.put('/:setlistId/songs/reorder', async (req, res) => {
  try {
    const { setlistId } = req.params;
    const { songs } = req.body; // Array of {id, position}
    
    // Verify setlist exists and is active
    const setlistResult = await pool.query(
      'SELECT id FROM setlists WHERE id = $1 AND is_active = true',
      [setlistId]
    );
    
    if (setlistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Setlist not found' });
    }
    
    // Update positions in a transaction
    await pool.query('BEGIN');
    
    try {
      for (const song of songs) {
        await pool.query(
          'UPDATE songs SET position = $1 WHERE id = $2 AND setlist_id = $3',
          [song.position, song.id, setlistId]
        );
      }
      
      await pool.query('COMMIT');
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
    
    // Get updated songs
    const updatedSongsResult = await pool.query(
      'SELECT id, title, position FROM songs WHERE setlist_id = $1 ORDER BY position ASC',
      [setlistId]
    );
    
    // Emit real-time update
    const io = req.app.get('io');
    io.to(`setlist-${setlistId}`).emit('songs:reordered', { 
      setlistId, 
      songs: updatedSongsResult.rows 
    });
    
    res.json(updatedSongsResult.rows);
  } catch (err) {
    console.error('Error reordering songs:', err);
    res.status(500).json({ error: 'Failed to reorder songs' });
  }
});

// Add song to setlist
router.post('/:setlistId/songs', async (req, res) => {
  try {
    const { setlistId } = req.params;
    const { title, position } = req.body;
    
    // Verify setlist exists and is active
    const setlistResult = await pool.query(
      'SELECT id FROM setlists WHERE id = $1 AND is_active = true',
      [setlistId]
    );
    
    if (setlistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Setlist not found' });
    }
    
    // If no position specified, add to end
    let songPosition = position;
    if (songPosition === undefined) {
      const maxPositionResult = await pool.query(
        'SELECT COALESCE(MAX(position), 0) + 1 as next_position FROM songs WHERE setlist_id = $1',
        [setlistId]
      );
      songPosition = maxPositionResult.rows[0].next_position;
    }
    
    const songId = uuidv4();
    
    const result = await pool.query(
      'INSERT INTO songs (id, setlist_id, title, position) VALUES ($1, $2, $3, $4) RETURNING *',
      [songId, setlistId, title, songPosition]
    );
    
    const newSong = result.rows[0];
    
    // Emit real-time update
    const io = req.app.get('io');
    io.to(`setlist-${setlistId}`).emit('song:added', { setlistId, song: newSong });
    
    res.status(201).json(newSong);
  } catch (err) {
    console.error('Error adding song:', err);
    res.status(500).json({ error: 'Failed to add song' });
  }
});

// Update song
router.put('/:setlistId/songs/:songId', async (req, res) => {
  try {
    const { setlistId, songId } = req.params;
    const { title, position } = req.body;
    
    // Verify setlist exists and is active
    const setlistResult = await pool.query(
      'SELECT id FROM setlists WHERE id = $1 AND is_active = true',
      [setlistId]
    );
    
    if (setlistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Setlist not found' });
    }
    
    const result = await pool.query(
      'UPDATE songs SET title = COALESCE($1, title), position = COALESCE($2, position) WHERE id = $3 AND setlist_id = $4 RETURNING *',
      [title, position, songId, setlistId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }
    
    const updatedSong = result.rows[0];
    
    // Emit real-time update
    const io = req.app.get('io');
    io.to(`setlist-${setlistId}`).emit('song:updated', { setlistId, song: updatedSong });
    
    res.json(updatedSong);
  } catch (err) {
    console.error('Error updating song:', err);
    res.status(500).json({ error: 'Failed to update song' });
  }
});

// Delete song
router.delete('/:setlistId/songs/:songId', async (req, res) => {
  try {
    const { setlistId, songId } = req.params;
    
    // Verify setlist exists and is active
    const setlistResult = await pool.query(
      'SELECT id FROM setlists WHERE id = $1 AND is_active = true',
      [setlistId]
    );
    
    if (setlistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Setlist not found' });
    }
    
    const result = await pool.query(
      'DELETE FROM songs WHERE id = $1 AND setlist_id = $2 RETURNING id',
      [songId, setlistId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }
    
    // Emit real-time update
    const io = req.app.get('io');
    io.to(`setlist-${setlistId}`).emit('song:deleted', { setlistId, songId });
    
    res.json({ message: 'Song deleted successfully' });
  } catch (err) {
    console.error('Error deleting song:', err);
    res.status(500).json({ error: 'Failed to delete song' });
  }
});

export default router;
