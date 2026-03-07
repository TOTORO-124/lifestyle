import React, { useRef, useEffect, useState } from 'react';

interface CanvasProps {
  isPresenter: boolean;
  onDraw?: (data: string) => void;
  initialData?: string;
}

export const Canvas: React.FC<CanvasProps> = ({ isPresenter, onDraw, initialData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        const temp = ctx.getImageData(0, 0, canvas.width, canvas.height);
        canvas.width = rect.width;
        canvas.height = rect.width * 0.75;
        ctx.putImageData(temp, 0, 0);
        
        if (initialData) {
          const img = new Image();
          img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          img.src = initialData;
        }
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!initialData) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    if (!isPresenter) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = initialData;
    }
  }, [initialData, isPresenter]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPresenter) return;
    setIsDrawing(true);
    const pos = getPos(e);
    lastPos.current = pos;
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isPresenter) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = lineWidth * 4;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPos.current = pos;
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (onDraw && canvasRef.current) {
      onDraw(canvasRef.current.toDataURL());
    }
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const clearCanvas = () => {
    if (!isPresenter) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (onDraw) onDraw('');
  };

  const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#8B4513'];

  return (
    <div className="flex flex-col w-full bg-white">
      <div className="relative w-full shadow-inner overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`w-full block touch-none ${isPresenter ? 'cursor-crosshair' : 'cursor-default'}`}
        />
      </div>
      
      {isPresenter && (
        <div className="bg-gray-100 p-3 border-t-2 border-gray-200 flex flex-col gap-4">
          {/* Colors Group */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {colors.map(c => (
              <button
                key={c}
                onClick={() => { setColor(c); setTool('pen'); }}
                className={`w-7 h-7 md:w-8 md:h-8 rounded-full border-2 transition-transform active:scale-90 ${color === c && tool === 'pen' ? 'border-[#217346] scale-110 shadow-md ring-2 ring-[#217346]/20' : 'border-white shadow-sm'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
            {/* Tools Group */}
            <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
              <button
                onClick={() => setTool('pen')}
                className={`p-2 rounded-lg transition-all active:scale-90 ${tool === 'pen' ? 'bg-[#217346] text-white shadow-inner' : 'text-gray-600 hover:bg-gray-50'}`}
                title="펜"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
              </button>
              <button
                onClick={() => setTool('eraser')}
                className={`p-2 rounded-lg transition-all active:scale-90 ${tool === 'eraser' ? 'bg-[#217346] text-white shadow-inner' : 'text-gray-600 hover:bg-gray-50'}`}
                title="지우개"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 20H7L3 16C2 15 2 13 3 12L13 2L22 11L20 13V20Z"/><path d="M17 17L22 12"/></svg>
              </button>
              <div className="w-px h-6 bg-gray-200 mx-1" />
              <button
                onClick={clearCanvas}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-all active:scale-90"
                title="전체 지우기"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>

            {/* Size Group */}
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 min-w-[140px]">
              <span className="text-[10px] font-bold text-gray-400 uppercase shrink-0">굵기</span>
              <input 
                type="range" min="1" max="20" 
                value={lineWidth} 
                onChange={(e) => setLineWidth(parseInt(e.target.value))}
                className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#217346]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
