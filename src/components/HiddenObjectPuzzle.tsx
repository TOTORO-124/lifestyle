import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Puzzle } from '../data/escapeRoomData';
import { CheckCircle2, Search } from 'lucide-react';

interface HiddenObjectPuzzleProps {
  puzzle: Puzzle;
  onSolve: (answer: string) => void;
  isSpectator?: boolean;
}

export const HiddenObjectPuzzle: React.FC<HiddenObjectPuzzleProps> = ({ puzzle, onSolve, isSpectator }) => {
  const [foundObjects, setFoundObjects] = useState<string[]>([]);
  const [lastFound, setLastFound] = useState<string | null>(null);

  const handleObjectClick = (objectId: string) => {
    if (isSpectator || foundObjects.includes(objectId)) return;

    const newFound = [...foundObjects, objectId];
    setFoundObjects(newFound);
    setLastFound(objectId);

    // Clear last found message after 2 seconds
    setTimeout(() => setLastFound(null), 2000);

    if (newFound.length === (puzzle.hiddenObjects?.length || 0)) {
      onSolve(puzzle.answer);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative group overflow-hidden rounded-2xl border-4 border-gray-200 shadow-inner bg-gray-100 aspect-[4/3]">
        <img 
          src={puzzle.imageUrl} 
          alt="Hidden Object Scene" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.src.includes('picsum.photos')) {
              target.src = `https://picsum.photos/seed/${puzzle.id}/1000/600`;
            }
          }}
        />
        
        {/* Clickable Areas */}
        {puzzle.hiddenObjects?.map((obj) => (
          <button
            key={obj.id}
            onClick={() => handleObjectClick(obj.id)}
            disabled={isSpectator || foundObjects.includes(obj.id)}
            className={`absolute border-2 rounded-full transition-all ${
              foundObjects.includes(obj.id) 
                ? 'border-green-500 bg-green-500/20 scale-110' 
                : 'border-transparent hover:border-white/50 hover:bg-white/10'
            }`}
            style={{
              left: `${obj.x}%`,
              top: `${obj.y}%`,
              width: `${obj.width}%`,
              height: `${obj.height}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {foundObjects.includes(obj.id) && (
              <CheckCircle2 className="text-green-500 w-full h-full p-1" />
            )}
          </button>
        ))}

        {/* Feedback Overlay */}
        <AnimatePresence>
          {lastFound && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-green-600 text-white rounded-full font-bold shadow-lg flex items-center gap-2"
            >
              <Search size={16} />
              {puzzle.hiddenObjects?.find(o => o.id === lastFound)?.name} 발견!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Checklist */}
      <div className="bg-gray-50 p-3 md:p-4 rounded-xl border-2 border-dashed border-gray-300">
        <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-2 md:mb-3">찾아야 할 물건들</p>
        <div className="flex flex-wrap gap-1.5 md:gap-2">
          {puzzle.hiddenObjects?.map((obj) => (
            <div 
              key={obj.id}
              className={`px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-sm font-bold flex items-center gap-1.5 md:gap-2 transition-all shrink-0 ${
                foundObjects.includes(obj.id)
                  ? 'bg-green-100 text-green-700 border-green-200'
                  : 'bg-white text-gray-500 border-gray-200'
              } border`}
            >
              {foundObjects.includes(obj.id) ? <CheckCircle2 size={12} className="md:w-3.5 md:h-3.5" /> : <div className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full border-2 border-gray-300" />}
              <span className="truncate max-w-[80px] md:max-w-none">{obj.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
