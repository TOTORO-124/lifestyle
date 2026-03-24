import { ref, push, get, query, orderByChild, limitToLast } from 'firebase/database';
import { db } from '../firebase';

export interface LeaderboardEntry {
  id?: string;
  name: string;
  money: number; // Storing as number since Firebase doesn't support BigInt directly
  round: number;
  date: string;
}

export const submitScore = async (name: string, money: bigint, round: number) => {
  if (!db) return;
  
  const entriesRef = ref(db, 'leaderboard');
  const newEntry: LeaderboardEntry = {
    name,
    money: Number(money), // Convert BigInt to Number for storage. Max safe integer is 9 quadrillion.
    round,
    date: new Date().toISOString()
  };
  
  await push(entriesRef, newEntry);
};

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  if (!db) return [];
  
  const entriesRef = ref(db, 'leaderboard');
  const q = query(entriesRef, orderByChild('money'), limitToLast(10));
  
  const snapshot = await get(q);
  if (snapshot.exists()) {
    const data = snapshot.val();
    const entries: LeaderboardEntry[] = Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    }));
    
    // Sort descending
    return entries.sort((a, b) => b.money - a.money);
  }
  
  return [];
};
