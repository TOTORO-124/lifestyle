import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Loader2 } from 'lucide-react';
import { ref, push, get, query, orderByChild, limitToLast } from 'firebase/database';
import { db, isConfigured } from '../firebase';

export interface CosmicJackpotLeaderboardEntry {
  id?: string;
  name: string;
  money: string | number; // Support both for backward compatibility
  round: number;
  date: string;
}

interface LeaderboardProps {
  onClose: () => void;
  currentScore?: bigint;
  currentRound?: number;
  isGameOver?: boolean;
}

export const CosmicJackpotLeaderboard: React.FC<LeaderboardProps> = ({ onClose, currentScore, currentRound, isGameOver }) => {
  const [entries, setEntries] = useState<CosmicJackpotLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    console.log("Fetching leaderboard...", { isConfigured, db: !!db });
    if (!db) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const entriesRef = ref(db, 'cosmicJackpotLeaderboard');
      const q = query(entriesRef, orderByChild('money'), limitToLast(20));
      
      const snapshot = await get(q);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const loadedEntries: CosmicJackpotLeaderboardEntry[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        
        // Sort descending by money (handle string or number)
        setEntries(loadedEntries.sort((a, b) => {
          const moneyA = BigInt(a.money || 0);
          const moneyB = BigInt(b.money || 0);
          if (moneyB > moneyA) return 1;
          if (moneyB < moneyA) return -1;
          return 0;
        }));
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard", error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting score...", { name, currentScore, currentRound, db: !!db });
    if (!name.trim() || currentScore === undefined || currentRound === undefined || !db) {
      if (!db) alert("데이터베이스가 설정되지 않았습니다.");
      return;
    }
    
    try {
      const entriesRef = ref(db, 'cosmicJackpotLeaderboard');
      const newEntry = {
        name: name.trim(),
        money: currentScore.toString(), // Store as string to avoid precision loss and BigInt issues
        round: currentRound,
        date: new Date().toISOString()
      };
      
      await push(entriesRef, newEntry);
      console.log("Score submitted successfully!");
      setSubmitted(true);
      fetchLeaderboard();
    } catch (error) {
      console.error("Failed to submit score", error);
      alert("점수 등록 중 오류가 발생했습니다: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-6"
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Trophy className="w-8 h-8 text-yellow-400" />
          <h2 className="text-3xl font-black text-white">명예의 전당</h2>
        </div>

        {!isConfigured && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-xs text-center">
            Firebase가 설정되지 않았습니다. .env 파일을 확인해주세요.
          </div>
        )}

        {isGameOver && currentScore !== undefined && !submitted && (
          <form onSubmit={handleSubmit} className="mb-8 bg-gray-800 p-4 rounded-xl border border-gray-700">
            <h3 className="text-lg text-gray-300 mb-2">당신의 기록을 남기세요!</h3>
            <div className="text-2xl text-[#00ffcc] font-bold mb-4">
              {currentScore.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}원 (Round {currentRound})
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력하세요"
                maxLength={10}
                className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00ffcc]"
                required
              />
              <button
                type="submit"
                className="bg-[#00ffcc] text-black px-4 py-2 rounded-lg font-bold hover:bg-white transition-colors"
              >
                등록
              </button>
            </div>
          </form>
        )}

        <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 mb-6">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="w-8 h-8 text-[#00ffcc] animate-spin" />
            </div>
          ) : entries.length > 0 ? (
            <div className="max-h-64 overflow-y-auto">
              {entries.map((entry, idx) => (
                <div 
                  key={entry.id} 
                  className={`flex items-center justify-between p-4 border-b border-gray-700 last:border-0 ${idx === 0 ? 'bg-yellow-500/10' : idx === 1 ? 'bg-gray-300/10' : idx === 2 ? 'bg-orange-500/10' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-bold w-6 text-center ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                      {idx + 1}
                    </span>
                    <span className="text-white font-medium">{entry.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[#00ffcc] font-bold">
                      {(() => {
                        try {
                          return BigInt(entry.money || 0).toLocaleString();
                        } catch (e) {
                          return Number(entry.money || 0).toLocaleString();
                        }
                      })()}원
                    </div>
                    <div className="text-xs text-gray-400">Round {entry.round}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              아직 등록된 기록이 없습니다.
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 transition-colors"
        >
          닫기
        </button>
      </div>
    </motion.div>
  );
};
