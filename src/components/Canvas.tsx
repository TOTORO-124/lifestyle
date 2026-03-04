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
    if (!isPresenter && initialData) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

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
    <div className="relative w-full bg-white border border-[#d1d1d1] shadow-inner overflow-hidden">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className={`w-full block ${isPresenter ? 'cursor-crosshair' : 'cursor-default'}`}
      />
      
      {isPresenter && (
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          <div className="bg-white/90 p-2 rounded border border-[#d1d1d1] shadow-sm flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-1">
              {colors.map(c => (
                <button
                  key={c}
                  onClick={() => { setColor(c); setTool('pen'); }}
                  className={`w-4 h-4 rounded-full border border-black/10 ${color === c && tool === 'pen' ? 'ring-2 ring-[#217346]' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="h-px bg-[#d1d1d1]" />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTool('pen')}
                className={`p-1 rounded border ${tool === 'pen' ? 'bg-[#e8f0fe] border-[#217346]' : 'bg-white border-[#d1d1d1]'}`}
                title="펜"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
              </button>
              <button
                onClick={() => setTool('eraser')}
                className={`p-1 rounded border ${tool === 'eraser' ? 'bg-[#e8f0fe] border-[#217346]' : 'bg-white border-[#d1d1d1]'}`}
                title="지우개"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 20H7L3 16C2 15 2 13 3 12L13 2L22 11L20 13V20Z"/><path d="M17 17L22 12"/></svg>
              </button>
              <button
                onClick={clearCanvas}
                className="p-1 rounded border bg-white border-[#d1d1d1] hover:bg-red-50"
                title="전체 지우기"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="red" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-bold text-[#999]">굵기</span>
              <input 
                type="range" min="1" max="20" 
                value={lineWidth} 
                onChange={(e) => setLineWidth(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#217346]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
