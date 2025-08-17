import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Backend API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const socket = io(API_BASE_URL);

// --- Helper Functions & Components ---

const getTodaysDate = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const year = today.getFullYear();
  return `${month}/${day}/${year}`;
};

const DragHandleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="5" r="1"></circle><circle cx="15" cy="5" r="1"></circle>
    <circle cx="9" cy="12" r="1"></circle><circle cx="15" cy="12" r="1"></circle>
    <circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="19" r="1"></circle>
  </svg>
);

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

// Setlist Dropdown Component
const SetlistDropdown = ({ setlists, currentSetlist, onSetlistChange, onCreateNew, onRemoveSetlist }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateOptions, setShowCreateOptions] = useState(false);
  const [newSetlistTitle, setNewSetlistTitle] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowCreateOptions(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCreateBlank = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/setlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSetlistTitle || 'New Setlist' })
      });
      
      if (response.ok) {
        const newSetlist = await response.json();
        onCreateNew(newSetlist);
        setNewSetlistTitle('');
        setShowCreateOptions(false);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error creating setlist:', error);
    }
  };

  const handleCopySetlist = async () => {
    if (!currentSetlist) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/setlists/${currentSetlist.id}/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSetlistTitle || `${currentSetlist.title} (Copy)` })
      });
      
      if (response.ok) {
        const newSetlist = await response.json();
        onCreateNew(newSetlist);
        setNewSetlistTitle('');
        setShowCreateOptions(false);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error copying setlist:', error);
    }
  };

  const handleRemoveSetlist = async () => {
    if (!currentSetlist || setlists.length <= 1) return;
    
    if (window.confirm(`Are you sure you want to remove "${currentSetlist.title}"?`)) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/setlists/${currentSetlist.id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          onRemoveSetlist(currentSetlist.id);
        }
      } catch (error) {
        console.error('Error removing setlist:', error);
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
      >
        <span>{currentSetlist ? currentSetlist.title : 'Select Setlist'}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50" ref={dropdownRef}>
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Current Setlists</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {setlists.map((setlist) => (
                  <button
                    key={setlist.id}
                    onClick={() => {
                      onSetlistChange(setlist);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-md transition-colors ${
                      currentSetlist?.id === setlist.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-medium">{setlist.title}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(setlist.created_at).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setShowCreateOptions(!showCreateOptions)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
                >
                  + New Setlist
                </button>
                {currentSetlist && setlists.length > 1 && (
                  <button
                    onClick={handleRemoveSetlist}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>

              {showCreateOptions && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newSetlistTitle}
                    onChange={(e) => setNewSetlistTitle(e.target.value)}
                    placeholder="Setlist title (optional)"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateBlank}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
                    >
                      Blank Setlist
                    </button>
                    <button
                      onClick={handleCopySetlist}
                      disabled={!currentSetlist}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors"
                    >
                      Copy Current
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// --- Sortable Song Cell Component ---
const SongCell = memo(function SongCell({ id, index, title, onTitleChange, onDelete, isOverlay = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const containerClasses = `flex items-center bg-gray-100 dark:bg-gray-800 p-3 rounded-lg mb-3 shadow-sm transition-all ${isOverlay ? 'shadow-2xl scale-105 z-50' : 'hover:shadow-md'}`;

  return (
    <div ref={setNodeRef} style={style} className={containerClasses}>
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab mr-3 text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
        aria-label="Drag song"
        type="button"
      >
        <DragHandleIcon />
      </button>
      <span className="font-bold w-10 text-gray-400 dark:text-gray-500 text-lg">
        {index + 1}.
      </span>
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(id, e.target.value)}
        className="flex-grow bg-transparent focus:outline-none text-gray-800 dark:text-gray-200 text-lg p-1 rounded-md focus:ring-2 focus:ring-blue-500"
        placeholder="Enter song title"
      />
      <button
        onClick={() => onDelete(id)}
        className="ml-4 text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
        aria-label="Delete song"
        type="button"
      >
        <DeleteIcon />
      </button>
    </div>
  );
});

// --- Main App Component ---
export default function SetlistManager() {
  const PLACEHOLDER_LOGO = 'https://placehold.co/300x100/1a202c/ffffff?text=BAND+LOGO';
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  const [setlists, setSetlists] = useState([]);
  const [currentSetlist, setCurrentSetlist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [logoSrc, setLogoSrc] = useState(null);
  const fileInputRef = useRef(null);
  const debounceTimeout = useRef(null);
  const titleDebounceTimeout = useRef(null);
  
  // Safari warning
  useEffect(() => {
    if (isSafari) {
      alert("⚠️ Safari Warning: For best print results, we recommend using Chrome or Firefox. Safari may display only one column when printing your setlist.");
    }
  }, [isSafari]);

  // Initialize and fetch setlists on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/setlists`);
        if (response.ok) {
          const setlistsData = await response.json();
          setSetlists(setlistsData);
          if (setlistsData.length > 0) {
            const lastViewedId = localStorage.getItem('currentSetlistId');
            const lastViewedSetlist = setlistsData.find(s => s.id === lastViewedId);
            setCurrentSetlist(lastViewedSetlist || setlistsData[0]);
          } else {
            setLoading(false); // No setlists, stop loading
          }
        } else {
          throw new Error('Failed to fetch setlists');
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        setError('Failed to load initial data');
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Persist current setlist ID to localStorage
  useEffect(() => {
    if (currentSetlist && currentSetlist.id) {
      localStorage.setItem('currentSetlistId', currentSetlist.id);
    }
  }, [currentSetlist]);

  // Load songs for the current setlist
  useEffect(() => {
    if (currentSetlist?.id) {
      const loadSetlistSongs = async () => {
        setLoading(true);
        try {
          const response = await fetch(`${API_BASE_URL}/api/setlists/${currentSetlist.id}`);
          if (response.ok) {
            const setlistData = await response.json();
            setSongs(setlistData.songs || []);
            setLogoSrc(setlistData.logo_url);
          }
        } catch (err) {
          console.error('Error loading setlist songs:', err);
          setError('Failed to load the selected setlist.');
        } finally {
          setLoading(false);
        }
      };
      loadSetlistSongs();
      socket.emit('join-setlist', currentSetlist.id);
    }
  }, [currentSetlist?.id]);

  // Socket.io event listeners setup
  useEffect(() => {
    console.log('Setting up Socket.io listeners...');
    socket.on('setlist:created', (newSetlist) => setSetlists(prev => [newSetlist, ...prev]));
    socket.on('setlist:updated', (updatedSetlist) => {
      setSetlists(prev => prev.map(s => s.id === updatedSetlist.id ? updatedSetlist : s));
      if (currentSetlist?.id === updatedSetlist.id) setCurrentSetlist(updatedSetlist);
    });
    socket.on('setlist:removed', ({ id }) => {
      if (localStorage.getItem('currentSetlistId') === id) {
        localStorage.removeItem('currentSetlistId');
      }
      setSetlists(prev => prev.filter(s => s.id !== id));
      if (currentSetlist?.id === id) setCurrentSetlist(setlists.find(s => s.id !== id) || null);
    });
    socket.on('song:added', ({ setlistId, song }) => {
      if (currentSetlist?.id === setlistId) setSongs(prev => [...prev, song]);
    });
    socket.on('song:updated', ({ setlistId, song }) => {
      if (currentSetlist?.id === setlistId) setSongs(prev => prev.map(s => s.id === song.id ? song : s));
    });
    socket.on('song:deleted', ({ setlistId, songId }) => {
      if (currentSetlist?.id === setlistId) setSongs(prev => prev.filter(s => s.id !== songId));
    });
    socket.on('songs:reordered', ({ setlistId, songs: reorderedSongs }) => {
      if (currentSetlist?.id === setlistId) setSongs(reorderedSongs);
    });

    return () => {
      socket.off('setlist:created');
      socket.off('setlist:updated');
      socket.off('setlist:removed');
      socket.off('song:added');
      socket.off('song:updated');
      socket.off('song:deleted');
      socket.off('songs:reordered');
    };
  }, []);

  // When the list of setlists changes, ensure currentSetlist is still valid
  useEffect(() => {
    if (currentSetlist && !setlists.some(s => s.id === currentSetlist.id)) {
      // The current setlist was deleted, select the first available one
      setCurrentSetlist(setlists[0] || null);
    }
  }, [setlists, currentSetlist]);

  // Load songs when current setlist changes
  useEffect(() => {
    if (currentSetlist?.id) {
      const loadSetlistSongs = async () => {
        setLoading(true);
        try {
          const response = await fetch(`${API_BASE_URL}/api/setlists/${currentSetlist.id}`);
          if (response.ok) {
            const setlistData = await response.json();
            setSongs(setlistData.songs || []);
            setLogoSrc(setlistData.logo_url);
          }
        } catch (err) {
          console.error('Error loading setlist songs:', err);
          setError('Failed to load the selected setlist.');
        } finally {
          setLoading(false);
        }
      };
      loadSetlistSongs();
      socket.emit('join-setlist', currentSetlist.id);
    }
  }, [currentSetlist?.id]);


  // --- Event Handlers ---
  
  const handleDragStart = useCallback((event) => setActiveId(event.active.id), []);

  const handleDragCancel = useCallback(() => setActiveId(null), []);

  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id && currentSetlist) {
      const oldIndex = songs.findIndex((s) => s.id === active.id);
      const newIndex = songs.findIndex((s) => s.id === over.id);
      const originalSongs = [...songs];

      // Optimistic UI update for instant feedback
      const newSongs = arrayMove(songs, oldIndex, newIndex);
      setSongs(newSongs);

      const songsWithPositions = newSongs.map((song, index) => ({
        id: song.id,
        position: index,
      }));

      try {
        await fetch(`${API_BASE_URL}/api/setlists/${currentSetlist.id}/songs/reorder`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ songs: songsWithPositions }),
        });
      } catch (error) {
        console.error('Error reordering songs:', error);
        // Revert on failure
        setSongs(originalSongs);
        alert('Failed to save the new song order. Please try again.');
      }
    }
    setActiveId(null);
  }, [songs, currentSetlist]);

  const handleSongTitleChange = useCallback((id, newTitle) => {
    if (!currentSetlist) return;
    setSongs(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(async () => {
      try {
        await fetch(`${API_BASE_URL}/api/setlists/${currentSetlist.id}/songs/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle }),
        });
      } catch (error) {
        console.error('Error updating song title:', error);
      }
    }, 500);
  }, [currentSetlist]);

  const addSong = useCallback(async () => {
    if (!currentSetlist) return;
    try {
      await fetch(`${API_BASE_URL}/api/setlists/${currentSetlist.id}/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Song' }),
      });
    } catch (error) {
      console.error('Error adding song:', error);
    }
  }, [currentSetlist]);

  const deleteSong = useCallback(async (id) => {
    if (!currentSetlist) return;

    // Optimistic UI update
    setSongs(prev => prev.filter(s => s.id !== id));
    
    try {
      await fetch(`${API_BASE_URL}/api/setlists/${currentSetlist.id}/songs/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting song:', error);
      // If the delete fails, you might want to add the song back to the list
      // For simplicity, we'll just log the error for now.
    }
  }, [currentSetlist]);

  const clearSetlist = useCallback(async () => {
    if (!currentSetlist || !window.confirm('Are you sure you want to delete all songs from this setlist?')) {
      return;
    }

    const originalSongs = [...songs];
    // Optimistic UI update for instant feedback
    setSongs([]);

    try {
      // Send all delete requests concurrently for better performance
      await Promise.all(
        originalSongs.map(song =>
          fetch(`${API_BASE_URL}/api/setlists/${currentSetlist.id}/songs/${song.id}`, {
            method: 'DELETE',
          })
        )
      );
    } catch (error) {
      console.error('Error clearing setlist:', error);
      // Revert on failure
      setSongs(originalSongs);
      alert('Failed to clear the setlist. Please try again.');
    }
  }, [currentSetlist, songs]);

  const exportToPdf = () => window.print();

  const triggerLogoUpload = () => fileInputRef.current?.click();

  const handleLogoChange = async (event) => {
    if (!currentSetlist) return;
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const newLogoSrc = e.target.result;
        const oldLogoSrc = logoSrc;
        setLogoSrc(newLogoSrc); // Optimistic update
        try {
          await fetch(`${API_BASE_URL}/api/setlists/${currentSetlist.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logo_url: newLogoSrc }),
          });
        } catch (error) {
          console.error('Error saving logo:', error);
          setLogoSrc(oldLogoSrc); // Revert on error
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = async (e) => {
    e.stopPropagation();
    if (!currentSetlist) return;
    if (window.confirm('Are you sure you want to remove your custom logo?')) {
      const oldLogo = logoSrc;
      setLogoSrc(null); // Optimistic update
      try {
        await fetch(`${API_BASE_URL}/api/setlists/${currentSetlist.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logo_url: null }),
        });
      } catch (error) {
        console.error('Error removing logo:', error);
        setLogoSrc(oldLogo); // Revert on error
      }
    }
  };

  const handleSetlistTitleChange = (newTitle) => {
    if (!currentSetlist) return;
    setCurrentSetlist(prev => ({ ...prev, title: newTitle }));
    if (titleDebounceTimeout.current) clearTimeout(titleDebounceTimeout.current);
    titleDebounceTimeout.current = setTimeout(async () => {
      try {
        await fetch(`${API_BASE_URL}/api/setlists/${currentSetlist.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle }),
        });
      } catch (error) {
        console.error('Error updating setlist title:', error);
      }
    }, 500);
  };
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );
  
  const activeSong = activeId ? songs.find(s => s.id === activeId) : null;

  // --- Render Logic ---

  if (loading && !currentSetlist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading Setlists...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">An Error Occurred</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans text-gray-900 dark:text-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header with Setlist Dropdown */}
        <header className="mb-8 flex justify-between items-center no-print">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Setlist Manager
          </h1>
          <SetlistDropdown
            setlists={setlists}
            currentSetlist={currentSetlist}
            onSetlistChange={setCurrentSetlist}
            onCreateNew={setCurrentSetlist}
            onRemoveSetlist={() => {
              // The actual removal is handled by the API call in the dropdown
              // and the socket event handler. This prop is just to trigger it.
              // No need to update state here directly.
            }}
          />
        </header>

        {currentSetlist ? (
          <div className="bg-white dark:bg-gray-800/50 p-6 sm:p-8 rounded-2xl shadow-lg printable-area">
            <div className="text-center mb-8">
              <div className="relative inline-block group no-print">
                <input type="file" ref={fileInputRef} onChange={handleLogoChange} accept="image/*" className="hidden" aria-label="Upload logo" />
                <img
                  src={logoSrc || PLACEHOLDER_LOGO}
                  alt="Band Logo"
                  className="mx-auto mb-6 rounded-lg cursor-pointer h-24 object-contain"
                  onClick={triggerLogoUpload}
                  onError={(e) => { e.currentTarget.src = PLACEHOLDER_LOGO; }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg mb-6" onClick={triggerLogoUpload}>
                  <p className="text-white font-bold text-lg">Click to change logo</p>
                </div>
                {logoSrc && (
                  <button onClick={removeLogo} className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-700" aria-label="Remove custom logo">X</button>
                )}
              </div>
              <div className="hidden print-header"><h1>{currentSetlist.title}</h1></div>
              <div className="flex justify-center items-center gap-4 no-print">
                <input
                  type="text"
                  value={currentSetlist.title}
                  onChange={(e) => handleSetlistTitleChange(e.target.value)}
                  className="text-3xl sm:text-4xl font-bold text-center bg-transparent focus:outline-none p-2 rounded-lg focus:ring-2 focus:ring-blue-500 w-full sm:w-auto min-w-[500px]"
                  aria-label="Setlist title"
                />
              </div>
            </div>

            <div className="no-print">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
                <SortableContext items={songs.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <main>
                    {songs.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                        {(() => {
                          const midpoint = Math.ceil(songs.length / 2);
                          const leftColumnSongs = songs.slice(0, midpoint);
                          const rightColumnSongs = songs.slice(midpoint);
                          return (
                            <>
                              <div className="flex flex-col">{leftColumnSongs.map((song, idx) => (<SongCell key={song.id} id={song.id} index={idx} title={song.title} onTitleChange={handleSongTitleChange} onDelete={deleteSong} />))}</div>
                              <div className="flex flex-col">{rightColumnSongs.map((song, idx) => (<SongCell key={song.id} id={song.id} index={midpoint + idx} title={song.title} onTitleChange={handleSongTitleChange} onDelete={deleteSong} />))}</div>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="text-center py-16 px-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Your Setlist is Empty</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Click "+ Add Song" to build your setlist!</p>
                      </div>
                    )}
                  </main>
                </SortableContext>
                <DragOverlay>
                  {activeId && activeSong ? (<SongCell id={activeSong.id} title={activeSong.title} index={songs.findIndex(s => s.id === activeId)} isOverlay={true} onTitleChange={() => {}} onDelete={() => {}} />) : null}
                </DragOverlay>
              </DndContext>
            </div>
            
            <div className="hidden song-list-container">{songs.map((song, index) => (<div key={song.id} className="song-cell-print"><span className="song-number">{index + 1}.</span><span className="song-title">{song.title || 'Untitled Song'}</span></div>))}</div>
            <div className="hidden print-footer">{logoSrc && (<img src={logoSrc} alt="Band Logo" className="rounded" onError={(e) => { e.currentTarget.style.display = 'none'; }} />)}<p>{currentSetlist.title}</p></div>
            
            <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400 no-print">
              <p>💡 Drag any song to reorder your setlist. Songs will automatically renumber.</p>
              {isSafari && (<p className="mt-2 text-amber-600 dark:text-amber-400 font-medium">⚠️ Safari users: For best print results, use Chrome or Firefox.</p>)}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">No Setlist Selected</h2>
            <p className="text-gray-500 dark:text-gray-400">Create a new setlist or select one from the dropdown to begin.</p>
          </div>
        )}
        
        {currentSetlist && (
          <footer className="mt-8 flex flex-wrap justify-center items-center gap-4 no-print">
            <button onClick={addSong} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all" type="button">+ Add Song</button>
            <button onClick={exportToPdf} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all" type="button">Export to PDF</button>
            {songs.length > 0 && (<button onClick={clearSetlist} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all" type="button">Clear Setlist</button>)}
          </footer>
        )}

        <div className="mt-12 text-center no-print">
          <a href="https://merrimackdata.com" target="_blank" rel="noopener noreferrer" className="inline-block hover:opacity-80 transition-opacity">
            <img src="merrimack-logo.png" alt="Merrimack Data" className="h-48 mx-auto" />
          </a>
        </div>
      </div>
    </div>
  );
}