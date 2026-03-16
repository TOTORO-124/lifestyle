import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Puzzle } from '../data/escapeRoomData';

interface CubePuzzleProps {
  puzzle: Puzzle;
  onSolve: (answer: string) => void;
  isSpectator?: boolean;
}

export const CubePuzzle: React.FC<CubePuzzleProps> = ({ puzzle, onSolve, isSpectator }) => {
  const [pattern, setPattern] = useState<string[][]>(
    Array.from({ length: 3 }, () => Array(3).fill('O'))
  );

  const toggleCell = (r: number, c: number) => {
    if (isSpectator) return;

    const newPattern = pattern.map((row, ri) => 
      row.map((cell, ci) => {
        if (ri === r && ci === c) {
          return cell === 'O' ? 'X' : 'O';
        }
        return cell;
      })
    );
    setPattern(newPattern);

    // Check if matches target
    const isSolved = newPattern.every((row, ri) => 
      row.every((cell, ci) => cell === puzzle.targetPattern?.[ri][ci])
    );

    if (isSolved) {
      onSolve(puzzle.answer);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">목표 패턴</p>
        <div className="grid grid-cols-3 gap-1 p-2 bg-gray-100 rounded-lg border">
          {puzzle.targetPattern?.map((row, ri) => 
            row.map((cell, ci) => (
              <div 
                key={`${ri}-${ci}`}
                className={`w-6 h-6 rounded-sm ${cell === 'X' ? 'bg-indigo-500' : 'bg-white border'}`}
              />
            ))
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <div className="grid grid-cols-3 gap-3 p-4 bg-gray-800 rounded-2xl shadow-2xl border-4 border-gray-700">
          {pattern.map((row, ri) => 
            row.map((cell, ci) => (
              <motion.button
                key={`${ri}-${ci}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleCell(ri, ci)}
                disabled={isSpectator}
                className={`w-16 h-16 rounded-xl flex items-center justify-center transition-all ${
                  cell === 'X' 
                    ? 'bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]' 
                    : 'bg-gray-700'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-4 ${cell === 'X' ? 'border-white' : 'border-gray-600'}`} />
              </motion.button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
