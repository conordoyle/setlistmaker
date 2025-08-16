import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
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

// --- Helper Functions & Components ---

// Get today's date in MM/DD/YYYY format
const getTodaysDate = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const year = today.getFullYear();
  return `${month}/${day}/${year}`;
};

// SVG Icon for the drag handle
const DragHandleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="5" r="1"></circle><circle cx="15" cy="5" r="1"></circle>
    <circle cx="9" cy="12" r="1"></circle><circle cx="15" cy="12" r="1"></circle>
    <circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="19" r="1"></circle>
  </svg>
);

// SVG Icon for the delete button
const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

// --- Sortable Song Cell Component (For Interactive View) ---
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
export default function SetlistApp() {
  const LOCAL_STORAGE_KEY = 'setlist-app-data-v2';
  const PLACEHOLDER_LOGO = 'https://placehold.co/300x100/1a202c/ffffff?text=BAND+LOGO';

  // Safari detection
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const fileInputRef = useRef(null);

  // Safari warning popup
  useEffect(() => {
    if (isSafari) {
      alert("⚠️ Safari Warning: For best print results, we recommend using Chrome or Firefox. Safari may display only one column when printing your setlist.");
    }
  }, [isSafari]);

  const loadInitialState = () => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.showInfo && Array.isArray(parsed.songs)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse localStorage data', e);
    }
    // Default state
    return {
      showInfo: 'My Awesome Show - ' + getTodaysDate(),
      songs: [
        { id: '1', title: 'Enter Sandman' }, { id: '2', title: 'Master of Puppets' },
        { id: '3', title: 'One' }, { id: '4', title: 'Fade to Black' },
        { id: '5', title: 'Nothing Else Matters' }, { id: '6', title: 'Welcome Home (Sanitarium)' },
        { id: '7', title: 'For Whom The Bell Tolls' }, { id: '8', title: 'Seek & Destroy' },
      ],
      logoSrc: null, // Start with no custom logo
    };
  };

  const [initialState] = useState(loadInitialState);
  const [showInfo, setShowInfo] = useState(initialState.showInfo);
  const [songs, setSongs] = useState(initialState.songs);
  const [logoSrc, setLogoSrc] = useState(initialState.logoSrc);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    try {
      const stateToSave = { showInfo, songs, logoSrc };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
        console.error("Could not save to localStorage. The logo file might be too large.", error);
        alert("Error saving your setlist. Your logo image might be too large for browser storage. Please try a smaller file.");
    }
  }, [showInfo, songs, logoSrc]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );
  
  const activeSong = activeId ? songs.find(s => s.id === activeId) : null;

  // --- Event Handlers ---
  const handleDragStart = useCallback((event) => setActiveId(event.active.id), []);
  
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSongs((items) => {
        const oldIndex = items.findIndex((s) => s.id === active.id);
        const newIndex = items.findIndex((s) => s.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    setActiveId(null);
  }, []);
  
  const handleDragCancel = useCallback(() => setActiveId(null), []);

  const handleSongTitleChange = useCallback((id, newTitle) => {
    setSongs((cur) => cur.map((s) => (s.id === id ? { ...s, title: newTitle } : s)));
  }, []);

  const addSong = useCallback(() => {
    setSongs((cur) => {
      const nextId = cur.length ? String(Math.max(...cur.map(s => parseInt(s.id, 10) || 0)) + 1) : '1';
      return [...cur, { id: nextId, title: 'New Song' }];
    });
  }, []);

  const deleteSong = useCallback((id) => {
    setSongs((cur) => cur.filter((s) => s.id !== id));
  }, []);

  const clearSetlist = () => {
    if (window.confirm('Are you sure you want to delete all songs from this setlist?')) {
      setSongs([]);
    }
  };

  const exportToPdf = () => {
    window.print();
  };

  const triggerLogoUpload = () => {
    fileInputRef.current?.click();
  };

  const handleLogoChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoSrc(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeLogo = (e) => {
    e.stopPropagation(); // prevent triggering the upload
    if (window.confirm('Are you sure you want to remove your custom logo?')) {
        setLogoSrc(null);
    }
  };


  // --- Render Logic ---
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans text-gray-900 dark:text-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-gray-800/50 p-6 sm:p-8 rounded-2xl shadow-lg printable-area">
          {/* === HEADER (for both screen and print) === */}
          <header className="text-center mb-8">
             <div className="relative inline-block group no-print">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoChange}
                    accept="image/*"
                    className="hidden"
                    aria-label="Upload logo"
                />
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
                    <button 
                        onClick={removeLogo} 
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-700"
                        aria-label="Remove custom logo"
                    >
                        X
                    </button>
                )}
            </div>

            {/* A simple header just for the PDF */}
            <div className="hidden print-header">
              <h1>{showInfo}</h1>
            </div>
            {/* The interactive input for the screen */}
            <div className="flex justify-center items-center gap-4 no-print">
              <input
                type="text"
                value={showInfo}
                onChange={(e) => setShowInfo(e.target.value)}
                className="text-3xl sm:text-4xl font-bold text-center bg-transparent focus:outline-none p-2 rounded-lg focus:ring-2 focus:ring-blue-500 w-full sm:w-auto min-w-[500px]"
                aria-label="Show name and date"
              />
            </div>
          </header>

          {/* === DRAG-AND-DROP AREA (Screen Only) === */}
          <div className="no-print">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
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
                            <div className="flex flex-col">
                              {leftColumnSongs.map((song, idx) => (
                                <SongCell key={song.id} id={song.id} index={idx} title={song.title} onTitleChange={handleSongTitleChange} onDelete={deleteSong} />
                              ))}
                            </div>
                            <div className="flex flex-col">
                              {rightColumnSongs.map((song, idx) => (
                                <SongCell key={song.id} id={song.id} index={midpoint + idx} title={song.title} onTitleChange={handleSongTitleChange} onDelete={deleteSong} />
                              ))}
                            </div>
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
                {activeId && activeSong ? (
                  <SongCell id={activeSong.id} title={activeSong.title} index={songs.findIndex(s => s.id === activeId)} isOverlay={true} onTitleChange={() => {}} onDelete={() => {}} />
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>

          {/* === SIMPLE LIST FOR PRINTING (Hidden on Screen) === */}
          <div className="hidden song-list-container">
            {songs.map((song, index) => (
              <div key={song.id} className="song-cell-print">
                <span className="song-number">{index + 1}.</span>
                <span className="song-title">{song.title || 'Untitled Song'}</span>
              </div>
            ))}
          </div>
          
          {/* A simple footer that will be styled and placed correctly by print CSS */}
          <div className="hidden print-footer">
            {logoSrc && (
                <img
                    src={logoSrc}
                    alt="Band Logo"
                    className="rounded"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
            )}
            <p>{showInfo}</p>
          </div>

          {/* Help text */}
          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400 no-print">
            <p>💡 Drag any song to reorder your setlist. Songs will automatically renumber.</p>
            {isSafari && (
              <p className="mt-2 text-amber-600 dark:text-amber-400 font-medium">
                ⚠️ Safari users: For best print results, use Chrome or Firefox. Safari may display only one column when printing.
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <footer className="mt-8 flex flex-wrap justify-center items-center gap-4 no-print">
          <button onClick={addSong} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-lg" type="button">
            + Add Song
          </button>
          <button onClick={exportToPdf} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-lg" type="button">
            Export to PDF
          </button>
          {songs.length > 0 && (
            <button onClick={clearSetlist} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-lg" type="button">
              Clear Setlist
            </button>
          )}
        </footer>

        {/* Company Logo */}
        <div className="mt-12 text-center no-print">
          <a 
            href="https://merrimackdata.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block hover:opacity-80 transition-opacity duration-200"
          >
            <img 
              src="merrimack-logo.png" 
              alt="Merrimack Data" 
              className="h-48 mx-auto"
            />
          </a>
        </div>
      </div>
    </div>
  );
}