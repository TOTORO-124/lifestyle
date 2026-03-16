import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Puzzle } from '../data/escapeRoomData';

interface SlidePuzzleProps {
  puzzle: Puzzle;
  onSolve: (answer: string) => void;
  isSpectator?: boolean;
}

export const SlidePuzzle: React.FC<SlidePuzzleProps> = ({ puzzle, onSolve, isSpectator }) => {
  const size = puzzle.gridSize || 3;
  const [grid, setGrid] = useState<number[]>([]);

  useEffect(() => {
    if (puzzle.initialGrid) {
      setGrid([...puzzle.initialGrid]);
    } else {
      // Default shuffle if no initial grid provided
      const initial = Array.from({ length: size * size }, (_, i) => i);
      setGrid(shuffle(initial));
    }
  }, [puzzle.initialGrid, size]);

  const shuffle = (array: number[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleTileClick = (index: number) => {
    if (isSpectator) return;

    const emptyIndex = grid.indexOf(0);
    const row = Math.floor(index / size);
    const col = index % size;
    const emptyRow = Math.floor(emptyIndex / size);
    const emptyCol = emptyIndex % size;

    const isAdjacent = (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
                      (Math.abs(col - emptyCol) === 1 && row === emptyRow);

    if (isAdjacent) {
      const newGrid = [...grid];
      [newGrid[index], newGrid[emptyIndex]] = [newGrid[emptyIndex], newGrid[index]];
      setGrid(newGrid);

      // Check if solved
      const isSolved = newGrid.every((val, i) => {
        if (i === newGrid.length - 1) return val === 0;
        return val === i + 1;
      });

      if (isSolved) {
        onSolve(puzzle.answer);
      }
    }
  };

  return (
    <div className="flex justify-center">
      <div 
        className="grid gap-2 p-2 bg-gray-200 rounded-xl shadow-inner border-4 border-gray-300"
        style={{ 
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          width: 'min(100%, 400px)',
          aspectRatio: '1/1'
        }}
      >
        {grid.map((tile, index) => (
          <motion.button
            key={index}
            layout
            onClick={() => handleTileClick(index)}
            disabled={isSpectator || tile === 0}
            className={`flex items-center justify-center text-2xl font-black rounded-lg shadow-md transition-all ${
              tile === 0 
                ? 'bg-transparent shadow-none cursor-default' 
                : 'bg-white text-gray-800 hover:bg-gray-50 active:scale-95'
            }`}
          >
            {tile !== 0 && tile}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
