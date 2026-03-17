import React, { useState } from 'react';
import { Trophy, AlertTriangle } from 'lucide-react';
import { sessionService } from '../services/sessionService';

const Leaderboard = ({ entries, title, sessionId, gameType }: { entries: any[], title: string, sessionId?: string | null, gameType?: string }) => {
  const rankNames = ['사장', '부사장', '전무', '상무', '이사', '부장', '차장', '과장', '대리', '사원'];
  const [deleteTarget, setDeleteTarget] = useState<{index: number, nickname: string} | null>(null);
  const [password, setPassword] = useState('');
  const [deleteError, setDeleteError] = useState(false);
  
  // Ensure entries is an array
  const safeEntries = Array.isArray(entries) ? entries : (entries ? Object.values(entries) : []);
  
  // Fill up to 10 entries for a consistent "Top 10" look
  const displayEntries = [...safeEntries];
  while (displayEntries.length < 10) {
    displayEntries.push(null);
  }

  const handleDeleteClick = (e: React.MouseEvent, index: number, nickname: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!sessionId || !gameType) return;
    setDeleteTarget({ index, nickname });
    setPassword('');
    setDeleteError(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !sessionId || !gameType) return;
    
    if (password === 'ad0419**') {
      await sessionService.removeLeaderboardEntry(sessionId, gameType, deleteTarget.index);
      setDeleteTarget(null);
      setPassword('');
    } else {
      setDeleteError(true);
    }
  };
  
  return (
    <div className="w-full bg-white border border-[#d1d1d1] rounded shadow-sm overflow-hidden relative">
      <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-amber-500" />
          <span className="text-[11px] font-bold text-[#444] tracking-tight truncate">{title} 명예의 전당</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[8px] text-[#999] italic font-medium">Moderation Active</span>
        </div>
      </div>

      {/* Custom Delete Modal Overlay */}
      {deleteTarget && (
        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
          <div className="mb-3">
            <AlertTriangle size={24} className="text-red-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-800">'{deleteTarget.nickname}'님의 기록 삭제</p>
            <p className="text-[10px] text-gray-500">관리자 비밀번호를 입력하세요.</p>
          </div>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setDeleteError(false);
            }}
            onKeyDown={(e) => e.key === 'Enter' && confirmDelete()}
            placeholder="비밀번호 입력"
            className={`w-full max-w-[160px] px-3 py-1.5 text-xs border rounded mb-2 text-center outline-none transition-all ${
              deleteError ? 'border-red-500 bg-red-50 animate-shake' : 'border-gray-300 focus:border-[#217346]'
            }`}
          />
          {deleteError && <p className="text-[9px] text-red-500 mb-2 font-bold">비밀번호가 일치하지 않습니다.</p>}
          <div className="flex gap-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-3 py-1 text-[10px] font-bold text-gray-500 hover:bg-gray-100 rounded transition-colors"
            >
              취소
            </button>
            <button
              onClick={confirmDelete}
              className="px-3 py-1 text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 rounded shadow-sm transition-colors"
            >
              삭제 확인
            </button>
          </div>
        </div>
      )}

      <div className="divide-y divide-[#f1f1f1]">
        {displayEntries.map((entry: any, i: number) => (
          <div key={entry?.playerId || i} className="group px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors min-h-[50px]">
            {entry ? (
              <>
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-black ${
                    i === 0 ? 'bg-[#ffc107] text-white shadow-sm' : 
                    i === 1 ? 'bg-[#adb5bd] text-white shadow-sm' : 
                    i === 2 ? 'bg-[#fd7e14] text-white shadow-sm' : 'text-[#999] bg-[#f8f9fa] border border-[#eee]'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-gray-800 leading-tight">{entry.nickname}</span>
                    <span className="text-[9px] text-[#217346] font-bold">{rankNames[i] || '인턴'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[12px] font-bold text-[#217346] tracking-tight">
                      {typeof entry.score === 'number' ? entry.score.toLocaleString() : entry.score}
                    </span>
                    <div className="flex flex-col items-end leading-tight">
                      <p className="text-[8px] text-gray-400 font-medium">{new Date(entry.timestamp).toLocaleDateString()}</p>
                      {entry.timeTaken && (
                        <p className="text-[8px] text-gray-500 italic font-medium">
                          {Math.floor(entry.timeTaken / 60)}분 {Math.floor(entry.timeTaken % 60)}초 / {entry.moveCount}수
                        </p>
                      )}
                      {entry.hintsUsed !== undefined && (
                        <p className="text-[8px] text-gray-500 italic font-medium">
                          {entry.completionTime ? `${Math.floor(entry.completionTime / 60)}분 ${entry.completionTime % 60}초` : ''} / 힌트 {entry.hintsUsed}회
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    {sessionId && gameType ? (
                      <button 
                        type="button"
                        onClick={(e) => handleDeleteClick(e, i, entry.nickname)}
                        className="p-1.5 text-red-200 hover:text-red-500 transition-all"
                        title="기록 삭제"
                      >
                        <AlertTriangle size={14} />
                      </button>
                    ) : (
                      <div className="p-1.5 text-red-200 opacity-60">
                        <AlertTriangle size={14} />
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 opacity-30">
                <span className="w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-bold text-[#999] bg-[#f8f9fa] border border-[#eee]">
                  {i + 1}
                </span>
                <span className="text-[10px] text-gray-400 italic font-medium">{rankNames[i] || '인턴'} 대기 중...</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
