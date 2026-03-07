import React, { useState, useEffect } from 'react';
import { Session, Player, SessionStatus, GameType, LiarMode, MafiaRole, MafiaPhase, GameLog } from './types';
import { sessionService } from './services/sessionService';
import { isConfigured } from './firebase';
import { Chat } from './components/Chat';
import { LIAR_TOPICS } from './data/topics';
import { BINGO_TOPICS } from './data/bingoTopics';
import { DRAW_TOPICS } from './data/drawTopics';
import { Canvas } from './components/Canvas';
import { Users, Shield, User, Play, LogOut, CheckCircle2, Circle, Settings2, AlertTriangle, FileText, Share2, HelpCircle, MoreVertical, Search, Filter, Grid, Download, Moon, Sun, Stethoscope, Siren, RefreshCw, ListOrdered, ArrowUp, ArrowDown, Hash, Edit3, Check, Palette, Timer, Trophy, Eye, MessageSquare, Send, Bomb, LayoutGrid } from 'lucide-react';

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
      // We don't use alert here as it might also be blocked, but it's usually less problematic than prompt.
      // Still, let's just close the modal.
    } else {
      setDeleteError(true);
    }
  };
  
  return (
    <div className="w-full bg-white border border-[#d1d1d1] rounded shadow-sm overflow-hidden mt-6 relative">
      <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-yellow-500" />
          <span className="text-[10px] font-bold text-[#666] uppercase tracking-wider">{title} 명예의 전당</span>
        </div>
        {sessionId && <span className="text-[8px] text-[#999] italic">Moderation Active</span>}
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
          <div key={i} className="group px-4 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors min-h-[45px]">
            {entry ? (
              <>
                <div className="flex items-center gap-3">
                  <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${
                    i === 0 ? 'bg-yellow-400 text-white' : 
                    i === 1 ? 'bg-gray-300 text-white' : 
                    i === 2 ? 'bg-orange-400 text-white' : 'text-[#999] bg-gray-100'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-800">{entry.nickname}</span>
                    <span className="text-[9px] text-[#217346] font-bold">{rankNames[i] || '인턴'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-[#217346]">{entry.score.toLocaleString()}</span>
                    <p className="text-[8px] text-gray-400">{new Date(entry.timestamp).toLocaleDateString()}</p>
                  </div>
                  {sessionId && gameType && (
                    <button 
                      type="button"
                      onClick={(e) => handleDeleteClick(e, i, entry.nickname)}
                      className="p-1.5 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                      title="기록 삭제"
                    >
                      <AlertTriangle size={14} />
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 opacity-30">
                <span className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold text-[#999] bg-gray-50">
                  {i + 1}
                </span>
                <span className="text-[10px] text-gray-400 italic">{rankNames[i] || '인턴'} 대기 중...</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [activeSheet, setActiveSheet] = useState<'GAME' | 'ROLES' | 'LOGS' | 'STATS' | 'HELP' | 'LEADERBOARD'>('GAME');
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [menuMode, setMenuMode] = useState<'create' | 'join'>('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [selectedVoteTarget, setSelectedVoteTarget] = useState<string | null>(null);
  const [selectedNightTarget, setSelectedNightTarget] = useState<string | null>(null);
  const [omokBlackId, setOmokBlackId] = useState<string>('');
  const [omokWhiteId, setOmokWhiteId] = useState<string>('');
  const [bingoBoard, setBingoBoard] = useState<string[][]>(Array(5).fill(null).map(() => Array(5).fill('')));
  const [bingoSubmitted, setBingoSubmitted] = useState(false);
  const [drawGuess, setDrawGuess] = useState('');
  const [showBingoWords, setShowBingoWords] = useState(false);
  const [showLiarKeyword, setShowLiarKeyword] = useState(false);
  const [selectedSudokuCell, setSelectedSudokuCell] = useState<{r: number, c: number} | null>(null);
  const [globalLeaderboards, setGlobalLeaderboards] = useState<Record<string, any[]>>({});

  const isHost = session?.hostId === currentUser?.uid;
  const me = session?.players?.[currentUser?.uid];

  useEffect(() => {
    if (session?.gameType === GameType.BINGO) {
      if (session.bingoGame?.boards?.[currentUser?.uid]) {
        setBingoBoard(session.bingoGame.boards[currentUser.uid]);
        setBingoSubmitted(true);
      } else if (session.status === SessionStatus.PREPARING || session.status === SessionStatus.LOBBY) {
        setBingoSubmitted(false);
        setBingoBoard(Array(5).fill(null).map(() => Array(5).fill('')));
      }
    }
  }, [session?.gameType, session?.bingoGame?.boards, currentUser?.uid, session?.status]);

  useEffect(() => {
    setSelectedVoteTarget(null);
    setSelectedNightTarget(null);
  }, [session?.status]);

  useEffect(() => {
    let interval: any;
    if (session?.status === SessionStatus.PLAYING && session.gameType === GameType.DRAW && isHost) {
      interval = setInterval(() => {
        if (session.drawGame && session.drawGame.timer > 0) {
          sessionService.updateDrawTimer(session.id, session.drawGame.timer - 1);
        } else if (session.drawGame && session.drawGame.timer === 0) {
          sessionService.nextDrawTurn(session.id, session);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [session?.status, session?.gameType, session?.drawGame?.timer, isHost]);

  // Synchronized Transitions
  useEffect(() => {
    if (!session || !session.players) return;
    
    // Only host triggers transitions
    if (session.hostId !== currentUser?.uid) return;

    const players = Object.values(session.players) as Player[];
    
    // Reveal -> Playing/Night
    if (session.status === SessionStatus.REVEAL) {
      const allConfirmed = players.every(p => p.hasConfirmedRole);
      if (allConfirmed && players.length > 0) {
        if (session.gameType === GameType.MAFIA) {
          sessionService.startNightPhase(session.id, session.players);
        } else {
          sessionService.advanceStatus(session.id, SessionStatus.PLAYING);
        }
      }
    }

    // Voting -> Vote Result
    if (session.status === SessionStatus.VOTING) {
      const alivePlayers = players.filter(p => p.isAlive);
      // Only require votes from connected players
      const activePlayers = alivePlayers.filter(p => p.isConnected !== false);
      const allVoted = activePlayers.every(p => p.voteTarget);
      
      if (allVoted && activePlayers.length > 0) {
        if (session.gameType === GameType.LIAR && session.liarGame) {
          sessionService.processLiarVote(session.id, session.players, session.liarGame);
        } else if (session.gameType === GameType.MAFIA) {
          sessionService.processMafiaVote(session.id, session.players);
        }
      }
    }
  }, [session, currentUser]);

  useEffect(() => {
    if (session?.id && currentUser && session.players?.[currentUser.uid]) {
      sessionService.updatePresence(session.id, currentUser.uid, true);
      
      return () => {
        sessionService.updatePresence(session.id, currentUser.uid, false);
      };
    }
  }, [session?.id, currentUser?.uid]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setJoinCode(roomParam);
    }
  }, []);

  useEffect(() => {
    sessionService.authenticate().then(setCurrentUser);
  }, []);

  useEffect(() => {
    const unsubscribe = sessionService.subscribeToGlobalLeaderboards((data) => {
      setGlobalLeaderboards(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (sessionId) {
      const unsubscribe = sessionService.subscribeToSession(sessionId, (data) => {
        if (!data) {
          setSessionId(null);
          setSession(null);
          setError('세션이 종료되었거나 찾을 수 없습니다.');
        } else {
          if (currentUser && data.players && !data.players[currentUser.uid]) {
            setSessionId(null);
            setSession(null);
            setError('방장에 의해 강퇴되었습니다.');
            return;
          }
          setSession(data);
        }
      });
      return () => unsubscribe();
    }
  }, [sessionId]);

  // Timer effect for Draw Game
  useEffect(() => {
    if (!session || session.gameType !== GameType.DRAW || session.status !== SessionStatus.PLAYING) return;
    if (!session.drawGame) return;

    // Only host manages the timer
    if (isHost) {
      const timerId = setInterval(() => {
        if (session.drawGame && session.drawGame.timer > 0) {
          sessionService.updateDrawTimer(session.id, session.drawGame.timer - 1);
        } else if (session.drawGame && session.drawGame.timer === 0) {
          // Time's up!
          sessionService.nextDrawTurn(session.id, session);
        }
      }, 1000);

      return () => clearInterval(timerId);
    }
  }, [session?.id, session?.gameType, session?.status, session?.drawGame?.timer, isHost]);

  // Keyboard support for 2048 and Sudoku
  useEffect(() => {
    if (!session || session.status !== SessionStatus.PLAYING) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling with arrow keys when playing 2048
      if (session.gameType === GameType.OFFICE_2048 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      if (session.gameType === GameType.OFFICE_2048) {
        if (e.key === 'ArrowUp') sessionService.moveOffice2048(session.id, 'UP', session);
        if (e.key === 'ArrowDown') sessionService.moveOffice2048(session.id, 'DOWN', session);
        if (e.key === 'ArrowLeft') sessionService.moveOffice2048(session.id, 'LEFT', session);
        if (e.key === 'ArrowRight') sessionService.moveOffice2048(session.id, 'RIGHT', session);
      } else if (session.gameType === GameType.SUDOKU && selectedSudokuCell) {
        if (e.key >= '1' && e.key <= '9') {
          sessionService.updateSudokuCell(session.id, selectedSudokuCell.r, selectedSudokuCell.c, parseInt(e.key), session);
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
          sessionService.updateSudokuCell(session.id, selectedSudokuCell.r, selectedSudokuCell.c, null, session);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [session, selectedSudokuCell]);

  const [chatMessage, setChatMessage] = useState('');
  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !session || !currentUser) return;
    await sessionService.sendMessage(session.id, currentUser.uid, nickname, chatMessage);
    setChatMessage('');
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [session?.messages]);

  const handleCreateSession = async (gameType: GameType) => {
    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      setError('닉네임을 입력해주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const id = await sessionService.createSession(trimmedNickname, gameType);
      setSessionId(id);
      setActiveSheet('GAME');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async () => {
    const trimmedNickname = nickname.trim();
    const trimmedJoinCode = joinCode.trim();

    if (!trimmedNickname) {
      setError('닉네임을 입력해주세요.');
      return;
    }
    if (!trimmedJoinCode) {
      setError('세션 코드를 입력해주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sessionService.joinSession(trimmedJoinCode, trimmedNickname);
      setSessionId(trimmedJoinCode);
      setActiveSheet('GAME');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReady = async () => {
    if (session && currentUser) {
      const player = session.players[currentUser.uid];
      await sessionService.updatePlayerReady(session.id, currentUser.uid, !player.isReady);
    }
  };

  const handleStartGame = async () => {
    if (!session) return;
    if (session.gameType === GameType.LIAR) {
      await sessionService.startLiarGame(session.id, session.players, session.settings, session.turnOrder);
    } else if (session.gameType === GameType.MAFIA) {
      await sessionService.startMafiaGame(session.id, session.players, session.settings, session.turnOrder);
    } else if (session.gameType === GameType.OMOK) {
      if (!omokBlackId || !omokWhiteId) {
        alert('두 명의 플레이어를 선택해주세요.');
        return;
      }
      await sessionService.startOmokGame(session.id, omokBlackId, omokWhiteId);
    } else if (session.gameType === GameType.BINGO) {
      await sessionService.startBingoSetup(session.id, session.settings);
    } else if (session.gameType === GameType.DRAW) {
      await sessionService.startDrawGame(session.id, session.players, session.settings, session.turnOrder || Object.keys(session.players));
    } else if (session.gameType === GameType.MINESWEEPER) {
      await sessionService.startMinesweeperGame(session.id, session.settings.minesweeperDifficulty || 'EASY');
    } else if (session.gameType === GameType.OFFICE_2048) {
      await sessionService.startOffice2048Game(session.id);
    } else if (session.gameType === GameType.SUDOKU) {
      await sessionService.startSudokuGame(session.id, session.settings.sudokuDifficulty || 'EASY');
    }
  };

  const handleLeaveSession = () => {
    setSessionId(null);
    setSession(null);
  };

  const handleCopyLink = () => {
    if (!session) return;
    const link = `${window.location.origin}${window.location.pathname}?room=${session.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSortedPlayers = () => {
    if (!session) return [];
    const players = Object.values(session.players) as Player[];
    if (!session.turnOrder) return players;
    
    return [...players].sort((a, b) => {
      const idxA = session.turnOrder!.indexOf(a.id);
      const idxB = session.turnOrder!.indexOf(b.id);
      // If a player is not in turnOrder (newly joined), put them at the end
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  };

  const handleMovePlayer = (index: number, direction: 'up' | 'down') => {
    if (!session) return;
    const currentOrder = getSortedPlayers().map(p => p.id);
    if (direction === 'up' && index > 0) {
      [currentOrder[index], currentOrder[index - 1]] = [currentOrder[index - 1], currentOrder[index]];
    } else if (direction === 'down' && index < currentOrder.length - 1) {
      [currentOrder[index], currentOrder[index + 1]] = [currentOrder[index + 1], currentOrder[index]];
    }
    sessionService.updateTurnOrder(session.id, currentOrder);
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6 bg-white p-8 border border-red-200 rounded-lg shadow-sm">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600">
              <AlertTriangle size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Firebase 설정 필요</h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              애플리케이션을 실행하려면 Firebase 설정이 필요합니다. <br/>
              <code className="bg-slate-100 px-1 rounded">.env.example</code> 파일을 참고하여 환경 변수를 설정해주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen spreadsheet-bg flex flex-col">
        {/* Excel-style Header */}
        <header className="bg-[#217346] text-white px-4 py-1.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-sm">
              <Grid className="text-[#217346]" size={16} />
            </div>
            <h1 className="text-sm font-bold tracking-tight">전사_명예의_전당_통합_보고서.xlsx</h1>
          </div>
          <div className="flex items-center gap-4 text-[10px] opacity-90">
            <span className="hidden sm:inline">자동 저장: 켬</span>
            <span className="bg-white/20 px-2 py-0.5 rounded">v2.4.0</span>
          </div>
        </header>

        {/* Formula Bar */}
        <div className="office-toolbar">
          <div className="bg-[#f8f9fa] border border-[#d1d1d1] px-3 py-0.5 min-w-[60px] text-center font-mono">A1</div>
          <div className="h-4 w-px bg-[#d1d1d1]" />
          <div className="flex-1 bg-white border border-[#d1d1d1] px-2 py-0.5 flex items-center gap-2">
            <span className="text-[#217346] font-bold italic">fx</span>
            <span className="font-mono truncate">=IF(사용자_인증, "전사_명예의_전당_준비완료", "본인_확인_대기중")</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          {activeSheet === 'GAME' ? (
            <div className="max-w-md w-full bg-white border border-[#d1d1d1] shadow-md rounded">
              <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 text-[10px] font-bold text-[#666] flex justify-between items-center">
                <span>사용자_인증_프롬프트</span>
                <MoreVertical size={12} />
              </div>
              
              {/* Tabs */}
              <div className="flex border-b border-[#d1d1d1]">
                <button 
                  className={`flex-1 py-3 text-xs font-bold transition-colors ${menuMode === 'create' ? 'bg-white border-b-2 border-b-[#217346] text-[#217346]' : 'bg-[#f8f9fa] text-[#999] hover:bg-[#f1f1f1]'}`}
                  onClick={() => setMenuMode('create')}
                >
                  새 세션 만들기
                </button>
                <button 
                  className={`flex-1 py-3 text-xs font-bold transition-colors ${menuMode === 'join' ? 'bg-white border-b-2 border-b-[#217346] text-[#217346]' : 'bg-[#f8f9fa] text-[#999] hover:bg-[#f1f1f1]'}`}
                  onClick={() => setMenuMode('join')}
                >
                  코드로 참여하기
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#666] uppercase">사용자 이름</label>
                    <input
                      type="text"
                      className="office-input border-[#d1d1d1]"
                      placeholder="닉네임을 입력하세요..."
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (menuMode === 'join') handleJoinSession();
                          else handleCreateSession(GameType.LIAR);
                        }
                      }}
                    />
                  </div>

                  {menuMode === 'create' ? (
                    <div className="space-y-3 pt-2">
                      <p className="text-[10px] text-[#999]">새로운 오피스 시트 세션을 생성하고 팀원들을 초대합니다.</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => handleCreateSession(GameType.LIAR)} 
                          className="office-btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1"
                          disabled={loading}
                        >
                          <span className="font-bold">라이어 시트</span>
                          <span className="text-[9px] font-normal opacity-80">거짓말쟁이 찾기</span>
                        </button>
                        <button 
                          onClick={() => handleCreateSession(GameType.MAFIA)} 
                          className="office-btn py-3 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1"
                          disabled={loading}
                        >
                          <span className="font-bold">마피아 시트</span>
                          <span className="text-[9px] font-normal opacity-80">범인 색출 작전</span>
                        </button>
                        <button 
                          onClick={() => handleCreateSession(GameType.OMOK)} 
                          className="office-btn py-3 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1"
                          disabled={loading}
                        >
                          <span className="font-bold">오목 (1:1)</span>
                          <span className="text-[9px] font-normal opacity-80">전략 보드 시트</span>
                        </button>
                        <button 
                          onClick={() => handleCreateSession(GameType.BINGO)} 
                          className="office-btn py-3 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1"
                          disabled={loading}
                        >
                          <span className="font-bold">빙고 (다수)</span>
                          <span className="text-[9px] font-normal opacity-80">데이터 매칭 감사</span>
                        </button>
                        <button 
                          onClick={() => handleCreateSession(GameType.DRAW)} 
                          className="office-btn py-3 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1"
                          disabled={loading}
                        >
                          <span className="font-bold">캐치마인드</span>
                          <span className="text-[9px] font-normal opacity-80">비주얼 브리핑</span>
                        </button>
                        <button 
                          onClick={() => handleCreateSession(GameType.MINESWEEPER)} 
                          className="office-btn py-3 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1"
                          disabled={loading}
                        >
                          <span className="font-bold">지뢰 찾기</span>
                          <span className="text-[9px] font-normal opacity-80">데이터 오류 검수</span>
                        </button>
                        <button 
                          onClick={() => handleCreateSession(GameType.OFFICE_2048)} 
                          className="office-btn py-3 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1"
                          disabled={loading}
                        >
                          <span className="font-bold">2048</span>
                          <span className="text-[9px] font-normal opacity-80">직급 승진 대작전</span>
                        </button>
                        <button 
                          onClick={() => handleCreateSession(GameType.SUDOKU)} 
                          className="office-btn py-3 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1"
                          disabled={loading}
                        >
                          <span className="font-bold">스도쿠</span>
                          <span className="text-[9px] font-normal opacity-80">데이터 무결성 검증</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2">
                      <p className="text-[10px] text-[#999]">공유받은 세션 코드를 입력하여 참여합니다.</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="office-input flex-1"
                          placeholder="세션_코드 (예: -Nxyz...)"
                          value={joinCode}
                          onChange={(e) => setJoinCode(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleJoinSession()}
                        />
                        <button 
                          onClick={handleJoinSession} 
                          className="office-btn px-6 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                          disabled={loading}
                        >
                          {loading ? '참여 중...' : '입장'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {error && <p className="text-[10px] text-red-600 font-mono bg-red-50 p-2 rounded border border-red-100">#오류: {error}</p>}
              </div>
            </div>
          ) : activeSheet === 'LEADERBOARD' ? (
            <div className="max-w-4xl w-full bg-white border border-[#d1d1d1] shadow-md rounded overflow-hidden">
              <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 text-[10px] font-bold text-[#666]">
                전사_명예의_전당_통합_보고서 (글로벌)
              </div>
              <div className="p-6">
                <p className="text-xs text-gray-500 mb-6 italic">* 전사 시트에서 기록된 실시간 순위입니다. (글로벌 통합)</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Leaderboard entries={globalLeaderboards?.OFFICE_2048 || []} title="직급 승진 (2048)" sessionId="GLOBAL" gameType="OFFICE_2048" />
                  <Leaderboard entries={globalLeaderboards?.MINESWEEPER || []} title="데이터 검수 (지뢰찾기)" sessionId="GLOBAL" gameType="MINESWEEPER" />
                  <Leaderboard entries={globalLeaderboards?.SUDOKU || []} title="데이터 무결성 (스도쿠)" sessionId="GLOBAL" gameType="SUDOKU" />
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl w-full bg-white border border-[#d1d1d1] shadow-md rounded overflow-hidden">
              <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 text-[10px] font-bold text-[#666]">
                시스템_설정_및_도움말
              </div>
              <div className="p-8 text-center space-y-4">
                <HelpCircle size={48} className="mx-auto text-[#217346] opacity-20" />
                <h3 className="text-lg font-bold text-gray-800">도움말 및 설정</h3>
                <p className="text-sm text-gray-500">세션에 입장한 후 상세한 시트 매뉴얼과 설정을 확인하실 수 있습니다.</p>
                <button 
                  onClick={() => setActiveSheet('GAME')}
                  className="office-btn-primary px-6 py-2"
                >
                  메인으로 돌아가기
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sheet Tabs */}
        <footer className="bg-[#f8f9fa] border-t border-[#d1d1d1] flex items-center h-8 shrink-0">
          <button 
            onClick={() => setActiveSheet('GAME')}
            className={`office-tab ${activeSheet === 'GAME' ? 'active' : ''}`}
          >
            메인_입력
          </button>
          <button 
            className="office-tab opacity-30 cursor-not-allowed"
            disabled
          >
            로그_시트
          </button>
          <button 
            onClick={() => setActiveSheet('LEADERBOARD')}
            className={`office-tab ${activeSheet === 'LEADERBOARD' ? 'active' : ''}`}
          >
            명예의_전당
          </button>
          <button 
            onClick={() => setActiveSheet('HELP')}
            className={`office-tab ${activeSheet === 'HELP' ? 'active' : ''}`}
          >
            설정
          </button>
          <div className="flex-1" />
          <div className="px-4 text-[10px] text-[#999]">100% 준비됨</div>
        </footer>
      </div>
    );
  }

  // Handle spectator mode
  if (me?.isSpectator) {
    return (
      <div className="min-h-screen bg-[#f3f2f1] font-sans text-[#333] flex flex-col">
        <header className="bg-[#217346] text-white px-4 py-3 shadow-md flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Grid size={18} />
            <h1 className="font-bold text-sm tracking-wide">전사_명예의_전당_통합_보고서.xlsx - 관전 모드</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 px-3 py-1 rounded text-xs flex items-center gap-2">
              <Eye size={12} />
              <span>{session?.players[currentUser.uid]?.nickname} (관전 중)</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 overflow-y-auto">
          {/* Render game view based on type, but without interaction controls */}
          {session?.gameType === GameType.DRAW && session.drawGame ? (
             <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-white border border-[#d1d1d1] rounded shadow-lg overflow-hidden">
                  <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-[#666]">비주얼_브리핑_진행 (관전)</span>
                      <div className="h-3 w-px bg-[#d1d1d1]" />
                      <div className="text-[10px] text-[#666]">라운드: <span className="font-bold text-[#217346]">{session.drawGame.round} / {session.drawGame.maxRounds}</span></div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-red-600">
                      <Timer size={14} />
                      <span>{session.drawGame.timer}s</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <Canvas 
                      isPresenter={false}
                      onDraw={() => {}}
                      initialData={session.drawGame.canvasData}
                      readOnly={true}
                    />
                  </div>
                </div>
                {/* Chat for spectators */}
                <div className="bg-white border border-[#d1d1d1] rounded shadow-sm flex flex-col h-64">
                   <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-3 py-2 text-[10px] font-bold text-[#666] flex items-center gap-2">
                      <MessageSquare size={10} />
                      실시간_채팅
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-white" ref={chatContainerRef}>
                      {(Object.values(session.messages || {}) as any[]).sort((a, b) => a.timestamp - b.timestamp).map((msg) => (
                        <div key={msg.id} className={`flex flex-col ${msg.senderId === currentUser.uid ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-baseline gap-1 mb-0.5">
                            <span className="text-[9px] font-bold text-[#333]">{msg.senderName}</span>
                            <span className="text-[8px] text-[#999]">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className={`px-2 py-1.5 rounded text-xs max-w-[80%] break-words ${
                            msg.isSystem ? 'bg-gray-100 text-gray-600 w-full text-center italic' :
                            msg.senderId === currentUser.uid ? 'bg-[#e8f0fe] text-[#1a73e8]' : 'bg-[#f1f3f4] text-[#202124]'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-2 bg-[#f8f9fa] border-t border-[#d1d1d1]">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="메시지를 입력하세요..."
                          className="office-input flex-1"
                        />
                        <button onClick={handleSendMessage} className="office-btn px-3">
                          <Send size={12} />
                        </button>
                      </div>
                    </div>
                </div>
             </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">현재 진행 중인 시트를 관전하고 있습니다.</p>
              <p className="text-sm text-gray-400 mt-2">시트 종류: {session?.gameType}</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (!session) return <div className="flex items-center justify-center h-screen spreadsheet-bg font-mono text-[10px] text-[#666]">#리소스_로드_중...</div>;

  return (
    <div className="min-h-screen spreadsheet-bg flex flex-col font-sans">
      {/* Header */}
      <header className="bg-[#217346] text-white px-4 py-1.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-sm">
            <Grid className="text-[#217346]" size={16} />
          </div>
          <h1 className="text-sm font-bold tracking-tight truncate max-w-[200px] sm:max-w-none">
            {session.gameType === GameType.LIAR ? '오피스_라이어_시트.xlsx' : 
             session.gameType === GameType.MAFIA ? '오피스_마피아_시트.xlsx' : 
             session.gameType === GameType.OMOK ? '오피스_오목_대전.xlsx' :
             session.gameType === GameType.BINGO ? '오피스_빙고_매칭.xlsx' : 
             session.gameType === GameType.DRAW ? '오피스_캐치마인드.xlsx' :
             session.gameType === GameType.MINESWEEPER ? '데이터_오류_검수.xlsx' :
             session.gameType === GameType.OFFICE_2048 ? '직급_승진_프로세스.xlsx' : '데이터_무결성_검증.xlsx'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded">
            <span>세션 ID: {session.id}</span>
            <button 
              onClick={handleCopyLink}
              className="hover:text-white transition-colors flex items-center gap-1"
              title="초대 링크 복사"
            >
              {copied ? <CheckCircle2 size={12} className="text-green-400" /> : <Share2 size={12} />}
              <span className="text-[8px]">{copied ? '복사됨' : '복사'}</span>
            </button>
          </div>
          <button onClick={handleLeaveSession} className="hover:bg-white/20 p-1 rounded transition-colors">
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Formula Bar */}
      <div className="office-toolbar">
        <div className="bg-[#f8f9fa] border border-[#d1d1d1] px-3 py-0.5 min-w-[60px] text-center font-mono">B2</div>
        <div className="h-4 w-px bg-[#d1d1d1]" />
        <div className="flex-1 bg-white border border-[#d1d1d1] px-2 py-0.5 flex items-center gap-2">
          <span className="text-[#217346] font-bold italic">fx</span>
          <span className="font-mono truncate">=현재_상태_확인("{session.status}")</span>
        </div>
      </div>

      {/* Quick Reaction Bar */}
      {activeSheet === 'GAME' && session.status !== SessionStatus.LOBBY && (
        <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-1.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[9px] font-bold text-[#999] uppercase whitespace-nowrap mr-2">신속_결재:</span>
          {[
            { label: '승인', color: 'bg-green-100 text-green-700 border-green-200' },
            { label: '반려', color: 'bg-red-100 text-red-700 border-red-200' },
            { label: '검토중', color: 'bg-blue-100 text-blue-700 border-blue-200' },
            { label: '수고하셨습니다', color: 'bg-gray-100 text-gray-700 border-gray-200' },
            { label: '퇴근각', color: 'bg-purple-100 text-purple-700 border-purple-200' },
            { label: '??', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
          ].map((reaction) => (
            <button
              key={reaction.label}
              onClick={() => sessionService.sendMessage(session.id, currentUser.uid, nickname, `[결재] ${reaction.label}`)}
              className={`px-2 py-0.5 rounded border text-[10px] font-bold whitespace-nowrap transition-transform active:scale-95 ${reaction.color}`}
            >
              {reaction.label}
            </button>
          ))}
        </div>
      )}

      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {activeSheet === 'GAME' ? (
            <>
              {session.status === SessionStatus.LOBBY && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 excel-grid rounded overflow-hidden shadow-sm">
                <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 text-[10px] font-bold text-[#666]">
                  참가자_데이터_그리드
                </div>
                <div className="overflow-x-auto">
                  <table className="excel-grid">
                    <thead>
                      <tr>
                        <th className="w-8"></th>
                        <th className="text-left pl-4">사용자_이름</th>
                        <th className="w-24">상태</th>
                        <th className="w-20">권한</th>
                        {isHost && <th className="w-16 text-center">순서</th>}
                        {isHost && <th className="w-16 text-center">관리</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {getSortedPlayers().map((player, idx) => (
                        <tr key={player.id} className="hover:bg-[#f1f8f5]">
                          <td className="bg-[#f8f9fa] border-r border-b border-[#d1d1d1] text-[9px] font-bold text-[#999] text-center">{idx + 1}</td>
                          <td className={`excel-cell ${player.id === currentUser?.uid ? 'bg-[#e8f0fe] font-bold' : ''}`}>
                            <div className="flex items-center gap-2">
                              {player.nickname}
                              {player.isHost && <Shield size={10} className="text-[#217346]" />}
                            </div>
                          </td>
                          <td className="excel-cell text-center">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full ${player.isReady ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {player.isReady ? '준비됨' : '대기중'}
                            </span>
                          </td>
                          <td className="excel-cell text-center text-[9px] text-[#999]">
                            {player.isHost ? '관리자' : '사용자'}
                          </td>
                          {isHost && (
                            <td className="excel-cell text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button 
                                  onClick={() => handleMovePlayer(idx, 'up')}
                                  disabled={idx === 0}
                                  className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30 text-[#666]"
                                  title="위로 이동"
                                >
                                  <ArrowUp size={12} />
                                </button>
                                <button 
                                  onClick={() => handleMovePlayer(idx, 'down')}
                                  disabled={idx === getSortedPlayers().length - 1}
                                  className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30 text-[#666]"
                                  title="아래로 이동"
                                >
                                  <ArrowDown size={12} />
                                </button>
                              </div>
                            </td>
                          )}
                          {isHost && (
                            <td className="excel-cell text-center">
                              {!player.isHost && (
                                <button 
                                  onClick={() => {
                                    if (confirm(`${player.nickname}님을 강퇴하시겠습니까?`)) {
                                      sessionService.kickPlayer(session.id, player.id);
                                    }
                                  }}
                                  className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                                  title="강퇴"
                                >
                                  <LogOut size={12} />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-[#d1d1d1] p-4 rounded shadow-sm space-y-4">
                  <h3 className="text-[10px] font-bold text-[#666] border-b border-[#d1d1d1] pb-2 uppercase">초대_정보</h3>
                  <div className="space-y-2">
                    <p className="text-[10px] text-[#999]">동료들을 감사 세션에 초대하세요.</p>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-[#f8f9fa] border border-[#d1d1d1] px-2 py-1 text-[10px] font-mono truncate">
                        {session.id}
                      </div>
                      <button 
                        onClick={handleCopyLink}
                        className="office-btn px-3 py-1 text-[10px] flex items-center gap-1"
                      >
                        {copied ? <CheckCircle2 size={10} /> : <Share2 size={10} />}
                        {copied ? '복사됨' : '링크_복사'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#d1d1d1] p-4 rounded shadow-sm space-y-4">
                  <h3 className="text-[10px] font-bold text-[#666] border-b border-[#d1d1d1] pb-2 uppercase">세션_제어</h3>
                  
                  {isHost ? (
                    <div className="space-y-4">
                      {session.gameType === GameType.LIAR && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#999]">시트_모드</label>
                            <select 
                              className="office-input text-xs"
                              value={session.settings.liarMode}
                              onChange={(e) => sessionService.updateSettings(session.id, { ...session.settings, liarMode: e.target.value })}
                            >
                              <option value={LiarMode.BASIC}>기본 (라이어 1명)</option>
                              <option value={LiarMode.FOOL}>바보 (라이어 다른 단어)</option>
                              <option value={LiarMode.SPY}>스파이 (스파이 포함)</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#999]">카테고리</label>
                            <select 
                              className="office-input text-xs"
                              value={session.settings.liarCategory}
                              onChange={(e) => sessionService.updateSettings(session.id, { ...session.settings, liarCategory: e.target.value })}
                            >
                              <option value="랜덤">랜덤</option>
                              {LIAR_TOPICS.map(t => <option key={t.category} value={t.category}>{t.category}</option>)}
                            </select>
                          </div>
                        </div>
                      )}

                      {session.gameType === GameType.MAFIA && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[#999]">마피아</label>
                              <input 
                                type="number" 
                                min="1" 
                                max="5"
                                className="office-input text-xs text-center"
                                value={session.settings.mafiaCount || 1}
                                onChange={(e) => sessionService.updateSettings(session.id, { ...session.settings, mafiaCount: parseInt(e.target.value) || 1 })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[#999]">의사</label>
                              <input 
                                type="number" 
                                min="0" 
                                max="2"
                                className="office-input text-xs text-center"
                                value={session.settings.doctorCount || 1}
                                onChange={(e) => sessionService.updateSettings(session.id, { ...session.settings, doctorCount: parseInt(e.target.value) || 0 })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[#999]">경찰</label>
                              <input 
                                type="number" 
                                min="0" 
                                max="2"
                                className="office-input text-xs text-center"
                                value={session.settings.policeCount || 1}
                                onChange={(e) => sessionService.updateSettings(session.id, { ...session.settings, policeCount: parseInt(e.target.value) || 0 })}
                              />
                            </div>
                          </div>
                          <div className="text-[10px] text-[#666] bg-[#f8f9fa] p-2 rounded border border-[#d1d1d1]">
                            <div className="flex justify-between">
                              <span>총 인원:</span>
                              <span className="font-bold">{(Object.values(session.players) as Player[]).length}명</span>
                            </div>
                            <div className="flex justify-between">
                              <span>특수직:</span>
                              <span className="font-bold">{(session.settings.mafiaCount || 1) + (session.settings.doctorCount || 1) + (session.settings.policeCount || 1)}명</span>
                            </div>
                            <div className="flex justify-between border-t border-[#d1d1d1] mt-1 pt-1">
                              <span>시민:</span>
                              <span className="font-bold text-[#217346]">
                                {Math.max(0, (Object.values(session.players) as Player[]).length - ((session.settings.mafiaCount || 1) + (session.settings.doctorCount || 1) + (session.settings.policeCount || 1)))}명
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {session.gameType === GameType.OMOK && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#999]">흑돌 (선공)</label>
                            <select 
                              className="office-input text-xs"
                              value={omokBlackId}
                              onChange={(e) => setOmokBlackId(e.target.value)}
                            >
                              <option value="">선택하세요</option>
                              {getSortedPlayers().map(p => (
                                <option key={p.id} value={p.id} disabled={p.id === omokWhiteId}>{p.nickname}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#999]">백돌 (후공)</label>
                            <select 
                              className="office-input text-xs"
                              value={omokWhiteId}
                              onChange={(e) => setOmokWhiteId(e.target.value)}
                            >
                              <option value="">선택하세요</option>
                              {getSortedPlayers().map(p => (
                                <option key={p.id} value={p.id} disabled={p.id === omokBlackId}>{p.nickname}</option>
                              ))}
                            </select>
                          </div>
                          <p className="text-[10px] text-[#999]">
                            * 오목은 두 명의 플레이어가 진행하며, 나머지는 관전합니다.
                          </p>
                        </div>
                      )}

                      {session.gameType === GameType.BINGO && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#999]">빙고 줄 수</label>
                            <input 
                              type="number" 
                              min="1" 
                              max="12"
                              className="office-input text-xs text-center"
                              value={session.settings.bingoLines || 3}
                              onChange={(e) => sessionService.updateSettings(session.id, { ...session.settings, bingoLines: parseInt(e.target.value) || 3 })}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#999]">카테고리</label>
                            <select 
                              className="office-input text-xs"
                              value={session.settings.bingoCategory || '랜덤'}
                              onChange={(e) => sessionService.updateSettings(session.id, { ...session.settings, bingoCategory: e.target.value })}
                            >
                              <option value="랜덤">랜덤</option>
                              {BINGO_TOPICS.map(t => <option key={t.category} value={t.category}>{t.category}</option>)}
                            </select>
                          </div>
                        </div>
                      )}

                      {session.gameType === GameType.DRAW && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[#999]">라운드 수</label>
                              <input 
                                type="number" 
                                min="1" 
                                max="10"
                                className="office-input text-xs text-center"
                                value={session.settings.drawRounds || 3}
                                onChange={(e) => sessionService.updateSettings(session.id, { ...session.settings, drawRounds: parseInt(e.target.value) || 3 })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[#999]">제한 시간(초)</label>
                              <input 
                                type="number" 
                                min="30" 
                                max="180"
                                className="office-input text-xs text-center"
                                value={session.settings.drawTime || 60}
                                onChange={(e) => sessionService.updateSettings(session.id, { ...session.settings, drawTime: parseInt(e.target.value) || 60 })}
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#999]">카테고리</label>
                            <select 
                              className="office-input text-xs"
                              value={session.settings.drawCategory || '랜덤'}
                              onChange={(e) => sessionService.updateSettings(session.id, { ...session.settings, drawCategory: e.target.value })}
                            >
                              <option value="랜덤">랜덤</option>
                              {DRAW_TOPICS.map(t => <option key={t.category} value={t.category}>{t.category}</option>)}
                            </select>
                          </div>
                        </div>
                      )}

                      {session.gameType === GameType.MINESWEEPER && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#999]">난이도</label>
                            <select 
                              className="office-input text-xs"
                              value={session.settings.minesweeperDifficulty || 'EASY'}
                              onChange={(e) => sessionService.updateSettings(session.id, { ...session.settings, minesweeperDifficulty: e.target.value })}
                            >
                              <option value="EASY">쉬움 (9x9, 지뢰 10개)</option>
                              <option value="MEDIUM">보통 (16x16, 지뢰 40개)</option>
                              <option value="HARD">어려움 (16x30, 지뢰 99개)</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {session.gameType === GameType.SUDOKU && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#999]">난이도</label>
                            <select 
                              className="office-input text-xs"
                              value={session.settings.sudokuDifficulty || 'EASY'}
                              onChange={(e) => sessionService.updateSettings(session.id, { ...session.settings, sudokuDifficulty: e.target.value })}
                            >
                              <option value="EASY">쉬움</option>
                              <option value="MEDIUM">보통</option>
                              <option value="HARD">어려움</option>
                            </select>
                          </div>
                        </div>
                      )}

                      <button 
                        onClick={() => sessionService.shuffleTurnOrder(session.id, session.players)}
                        className="office-btn w-full py-2 flex items-center justify-center gap-2"
                      >
                        <RefreshCw size={14} />
                        <span>참가자 순서 섞기</span>
                      </button>
                      <button onClick={handleStartGame} className="office-btn-primary w-full py-2">
                        세션_실행
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 text-center">
                      <p className="text-[10px] text-[#666]">관리자가 시작하기를 기다리는 중...</p>
                      <button 
                        onClick={handleToggleReady}
                        className={`w-full py-2 ${me?.isReady ? 'office-btn' : 'office-btn-primary'}`}
                      >
                        {me?.isReady ? '준비_취소' : '준비_완료'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {session.status === SessionStatus.REVEAL && (
            <div className="max-w-md mx-auto">
              <div className="bg-white border-2 border-[#217346] rounded shadow-xl overflow-hidden">
                <div className="bg-[#217346] text-white px-4 py-2 text-[10px] font-bold">
                  기밀_데이터_확인
                </div>
                <div className="p-10 text-center space-y-8">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#999] uppercase tracking-widest">배정된 역할</span>
                    <div className="text-4xl font-black text-[#217346]">
                      {session.gameType === GameType.LIAR ? (
                        session.liarGame?.mode === LiarMode.FOOL && session.liarGame?.liarPlayerId === currentUser?.uid ? '시민' : (
                          session.liarGame?.liarPlayerId === currentUser?.uid ? '라이어' : 
                          session.liarGame?.spyPlayerId === currentUser?.uid ? '스파이' : '시민'
                        )
                      ) : (
                        me?.role === 'MAFIA' ? '마피아' : 
                        me?.role === 'DOCTOR' ? '의사' :
                        me?.role === 'POLICE' ? '경찰' : '시민'
                      )}
                    </div>
                  </div>

                  <div className="bg-[#f8f9fa] border border-[#d1d1d1] p-6 inline-block min-w-[200px] rounded">
                    <span className="text-[10px] font-bold text-[#999] uppercase mb-2 block">
                      {session.gameType === GameType.LIAR ? `카테고리: ${session.liarGame?.category}` : '목표 키워드'}
                    </span>
                    <div className="text-2xl font-bold text-[#333]">
                      {session.gameType === GameType.LIAR ? (
                        session.liarGame?.liarPlayerId === currentUser?.uid ? (
                          session.liarGame.mode === LiarMode.FOOL ? session.liarGame.liarWord : '???'
                        ) : session.liarGame?.commonWord
                      ) : '해당 없음'}
                    </div>
                  </div>

                  {me?.hasConfirmedRole ? (
                    <div className="p-4 bg-gray-100 rounded text-center">
                      <div className="animate-pulse text-sm font-bold text-gray-500">다른 플레이어 대기 중...</div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        {(Object.values(session.players) as Player[]).filter(p => p.hasConfirmedRole).length} / {(Object.values(session.players) as Player[]).length} 명 확인 완료
                      </div>
                      {isHost && (
                        <button 
                          onClick={() => {
                            if (session.gameType === GameType.MAFIA) {
                              sessionService.startNightPhase(session.id, session.players);
                            } else {
                              sessionService.advanceStatus(session.id, SessionStatus.PLAYING);
                            }
                          }}
                          className="mt-4 text-xs text-red-500 underline hover:text-red-700"
                        >
                          강제 시작 (모든 플레이어 확인 무시)
                        </button>
                      )}
                    </div>
                  ) : (
                    <button 
                      onClick={() => sessionService.confirmRole(session.id, currentUser.uid)}
                      className="office-btn-primary w-full py-3"
                    >
                      데이터_확인_완료
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {session.status === SessionStatus.PREPARING && session.gameType === GameType.BINGO && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white border border-[#d1d1d1] rounded shadow-lg overflow-hidden">
                <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-[#666]">빙고_시트_작성</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        const category = session.bingoGame?.category || '랜덤';
                        let words: string[] = [];
                        if (category === '랜덤') {
                          words = Array.from(new Set(BINGO_TOPICS.flatMap(t => t.words)));
                        } else {
                          words = BINGO_TOPICS.find(t => t.category === category)?.words || [];
                        }
                        const shuffled = [...words].sort(() => 0.5 - Math.random());
                        const newBoard = Array(5).fill(null).map((_, r) => 
                          Array(5).fill(null).map((_, c) => shuffled[r * 5 + c] || '')
                        );
                        setBingoBoard(newBoard);
                      }}
                      className="text-[10px] text-[#217346] hover:underline flex items-center gap-1"
                    >
                      <RefreshCw size={10} /> 자동 채우기
                    </button>
                  </div>
                </div>
                
                <div className="p-6 flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="grid grid-cols-5 gap-1 bg-[#d1d1d1] p-1 border border-[#d1d1d1]">
                      {bingoBoard.map((row, r) => (
                        row.map((cell, c) => (
                          <input
                            key={`${r}-${c}`}
                            type="text"
                            value={cell}
                            onChange={(e) => {
                              const newBoard = [...bingoBoard.map(row => [...row])];
                              newBoard[r][c] = e.target.value;
                              setBingoBoard(newBoard);
                            }}
                            disabled={bingoSubmitted}
                            className="w-full aspect-square text-center text-xs p-1 focus:outline-none focus:bg-[#e8f0fe] border border-transparent focus:border-[#217346]"
                            placeholder="..."
                          />
                        ))
                      ))}
                    </div>
                  </div>

                  <div className="w-full md:w-64 space-y-4">
                    <div className="bg-[#f8f9fa] border border-[#d1d1d1] rounded p-3 h-full flex flex-col">
                      <div className="flex justify-between items-center mb-2 shrink-0">
                        <h4 className="text-[9px] font-bold text-[#999] uppercase flex items-center gap-1">
                          <ListOrdered size={10} />
                          추천 단어 ({session.bingoGame?.category || '랜덤'})
                        </h4>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2 max-h-[300px] content-start pr-1">
                        {(session.bingoGame?.category === '랜덤' 
                          ? Array.from(new Set(BINGO_TOPICS.flatMap(t => t.words)))
                          : BINGO_TOPICS.find(t => t.category === session.bingoGame?.category)?.words || []
                        ).map(word => (
                          <button
                            key={word}
                            onClick={() => {
                              if (bingoSubmitted) return;
                              // Find first empty cell
                              const newBoard = [...bingoBoard.map(row => [...row])];
                              let found = false;
                              for (let r = 0; r < 5; r++) {
                                for (let c = 0; c < 5; c++) {
                                  if (!newBoard[r][c]) {
                                    newBoard[r][c] = word;
                                    found = true;
                                    break;
                                  }
                                }
                                if (found) break;
                              }
                              if (found) setBingoBoard(newBoard);
                            }}
                            className="text-[10px] p-2 bg-white border border-[#d1d1d1] hover:bg-[#e8f0fe] hover:border-[#217346] hover:text-[#217346] text-left rounded transition-colors flex items-center h-8"
                            title="클릭하여 빈 칸에 추가"
                          >
                            <span className="truncate w-full">{word}</span>
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 text-[9px] text-[#999] text-center shrink-0">
                        단어를 클릭하면 빈 칸에 자동으로 채워집니다.
                      </div>
                    </div>
                  </div>
                </div>
                  
                  <div className="mt-6 flex flex-col items-center gap-4">
                    {bingoSubmitted ? (
                      <div className="text-center">
                        <div className="animate-pulse text-sm font-bold text-[#217346]">시트 제출 완료! 다른 플레이어 대기 중...</div>
                        <div className="text-[10px] text-gray-400 mt-1">
                          {Object.keys(session.bingoGame?.boards || {}).length} / {Object.keys(session.players).length} 명 완료
                        </div>
                        {isHost && (
                          <button 
                            onClick={() => sessionService.startBingoGame(session.id, session.players, session.turnOrder || Object.keys(session.players))}
                            className="mt-4 text-xs text-red-500 underline hover:text-red-700"
                          >
                            강제 시작 (미제출자 무시)
                          </button>
                        )}
                      </div>
                    ) : (
                      <button 
                        onClick={() => {
                          const isComplete = bingoBoard.every(row => row.every(cell => cell.trim() !== ''));
                          if (!isComplete && !confirm('빈 칸이 있습니다. 그대로 제출하시겠습니까?')) return;
                          sessionService.submitBingoBoard(session.id, currentUser.uid, bingoBoard, Object.keys(session.players).length);
                          setBingoSubmitted(true);
                        }}
                        className="office-btn-primary px-12 py-2"
                      >
                        시트_제출
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

          {session.status === SessionStatus.PLAYING && (
            session.gameType === GameType.OMOK ? (
              <div className="max-w-xl mx-auto space-y-6">
                <div className="bg-white border border-[#d1d1d1] rounded shadow-lg overflow-hidden">
                  <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-[#666]">오목_대전_보드</span>
                    <div className="flex items-center gap-2 text-xs">
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded ${session.omokGame?.currentPlayerId === session.omokGame?.blackPlayerId ? 'bg-black text-white font-bold shadow-sm' : 'bg-gray-100 text-gray-400'}`}>
                        <div className="w-2 h-2 rounded-full bg-black border border-white/20"></div>
                        <span>{session.players[session.omokGame!.blackPlayerId].nickname}</span>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded ${session.omokGame?.currentPlayerId === session.omokGame?.whitePlayerId ? 'bg-white border border-gray-300 text-black font-bold shadow-sm' : 'bg-gray-100 text-gray-400'}`}>
                        <div className="w-2 h-2 rounded-full bg-white border border-gray-300"></div>
                        <span>{session.players[session.omokGame!.whitePlayerId].nickname}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8 md:p-12 flex justify-center bg-white">
                    <div 
                      className="grid grid-cols-[repeat(15,minmax(0,1fr))] bg-[#e6b06e] border-2 border-[#8b4513] p-1 shadow-2xl rounded-sm"
                      style={{ width: 'min(100%, 500px)', aspectRatio: '1/1' }}
                    >
                      {(Array.isArray(session.omokGame?.board) ? session.omokGame.board : Object.values(session.omokGame?.board || {})).map((row: any, y: number) => (
                        (Array.isArray(row) ? row : Object.values(row || {})).map((cell: any, x: number) => {
                          const isWinningStone = session.omokGame?.winningLine?.some(pos => pos.x === x && pos.y === y);
                          return (
                            <div 
                              key={`${x}-${y}`} 
                              onClick={() => {
                                if (session.omokGame?.currentPlayerId === currentUser.uid && cell === 0) {
                                  sessionService.placeOmokStone(session.id, currentUser.uid, x, y);
                                }
                              }}
                              className={`relative flex items-center justify-center cursor-pointer hover:bg-black/5 ${isWinningStone ? 'bg-yellow-200/50' : ''}`}
                            >
                              {/* Grid lines */}
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-full h-px bg-black/40"></div>
                                <div className="h-full w-px bg-black/40 absolute"></div>
                              </div>
                              
                              {/* Stone */}
                              {cell === 1 && (
                                <div className={`w-[85%] h-[85%] rounded-full bg-black shadow-md z-10 relative transform transition-transform duration-200 scale-100 flex items-center justify-center ${isWinningStone ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}`}>
                                  {session.omokGame?.lastMove?.x === x && session.omokGame?.lastMove?.y === y && (
                                    <div className="w-[30%] h-[30%] rounded-full bg-red-500 animate-pulse" />
                                  )}
                                  {isWinningStone && (
                                    <div className="absolute inset-0 rounded-full animate-ping bg-yellow-400 opacity-20" />
                                  )}
                                </div>
                              )}
                              {cell === 2 && (
                                <div className={`w-[85%] h-[85%] rounded-full bg-white border border-gray-300 shadow-md z-10 relative transform transition-transform duration-200 scale-100 flex items-center justify-center ${isWinningStone ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}`}>
                                  {session.omokGame?.lastMove?.x === x && session.omokGame?.lastMove?.y === y && (
                                    <div className="w-[30%] h-[30%] rounded-full bg-red-500 animate-pulse" />
                                  )}
                                  {isWinningStone && (
                                    <div className="absolute inset-0 rounded-full animate-ping bg-yellow-400 opacity-20" />
                                  )}
                                </div>
                              )}
                              
                              {/* Hover preview for current player */}
                              {cell === 0 && session.omokGame?.currentPlayerId === currentUser.uid && (
                                <div className={`absolute w-[40%] h-[40%] rounded-full opacity-0 hover:opacity-50 transition-opacity z-20 ${
                                  session.omokGame.blackPlayerId === currentUser.uid ? 'bg-black' : 'bg-white border border-gray-300'
                                }`} />
                              )}
                            </div>
                          );
                        })
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-[#f8f9fa] border-t border-[#d1d1d1] px-4 py-3 text-center text-xs">
                    {session.omokGame?.currentPlayerId === currentUser.uid ? (
                      <div className="flex items-center justify-center gap-2 text-[#217346] font-bold animate-pulse">
                        <Play size={12} fill="currentColor" />
                        <span>당신의 차례입니다! 돌을 놓을 위치를 선택하세요.</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-[#666]">
                        {session.omokGame?.blackPlayerId === currentUser.uid || session.omokGame?.whitePlayerId === currentUser.uid ? (
                          <>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            <span>상대방의 수를 기다리는 중입니다...</span>
                          </>
                        ) : (
                          <span className="font-medium text-gray-500">현재 관전 중입니다.</span>
                        )}
                      </div>
                    )}
                    <div className="mt-2 text-[10px] text-gray-400">
                      * 흑돌은 3-3, 4-4, 6목(장목) 금지 (공식 룰 적용) / 백돌은 제한 없음
                    </div>
                  </div>
                </div>

                {/* Spectator List */}
                <div className="bg-white border border-[#d1d1d1] rounded shadow-sm p-4">
                  <h3 className="text-[10px] font-bold text-[#666] mb-2 uppercase">관전 중인 플레이어</h3>
                  <div className="flex flex-wrap gap-2">
                    {(Object.values(session.players) as Player[]).filter(p => p.id !== session.omokGame?.blackPlayerId && p.id !== session.omokGame?.whitePlayerId).map(p => (
                      <div key={p.id} className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600 flex items-center gap-1">
                        <User size={10} />
                        {p.nickname}
                      </div>
                    ))}
                    {(Object.values(session.players) as Player[]).filter(p => p.id !== session.omokGame?.blackPlayerId && p.id !== session.omokGame?.whitePlayerId).length === 0 && (
                      <span className="text-xs text-gray-400">관전자가 없습니다.</span>
                    )}
                  </div>
                </div>
              </div>
            ) : session.gameType === GameType.BINGO ? (
              !session.bingoGame ? (
                <div className="flex flex-col items-center justify-center p-10">
                  <RefreshCw className="animate-spin text-[#217346] mb-4" size={32} />
                  <p className="text-sm text-gray-500">빙고 시트 데이터를 불러오는 중입니다...</p>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white border border-[#d1d1d1] rounded shadow-lg overflow-hidden">
                  <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-[#666]">빙고_감사_진행</span>
                    <div className="flex items-center gap-3">
                      <div className="text-[10px] text-[#666]">목표: <span className="font-bold text-[#217346]">{session.bingoGame?.targetLines}줄</span></div>
                      <div className="h-3 w-px bg-[#d1d1d1]" />
                      <div className="text-[10px] text-[#666]">현재: <span className="font-bold text-[#217346]">{session.bingoGame?.boards[currentUser.uid] ? sessionService.countBingoLines(session.bingoGame.boards[currentUser.uid], session.bingoGame.markedWords || []) : 0}줄</span></div>
                    </div>
                  </div>

                  <div className="p-8 md:p-12 flex flex-col md:flex-row gap-12">
                    {/* My Board */}
                    <div className="flex-1 space-y-4">
                      <h3 className="text-[10px] font-bold text-[#999] uppercase tracking-wider">나의 감사 시트</h3>
                      <div className="relative shadow-xl rounded-lg overflow-hidden border border-[#d1d1d1]">
                        <div className="grid grid-cols-5 gap-1 bg-[#d1d1d1] p-1">
                          {(Array.isArray(session.bingoGame?.boards?.[currentUser.uid]) ? session.bingoGame.boards[currentUser.uid] : Object.values(session.bingoGame?.boards?.[currentUser.uid] || {})).map((row: any, r: number) => (
                            (Array.isArray(row) ? row : Object.values(row || {})).map((word: any, c: number) => {
                              const isMarked = (session.bingoGame?.markedWords || []).includes(word);
                              const isMyTurn = session.bingoGame?.currentPlayerId === currentUser.uid;
                              return (
                                <button
                                  key={`${r}-${c}`}
                                  disabled={!isMyTurn || isMarked}
                                  onClick={() => sessionService.pickBingoWord(session.id, currentUser.uid, word, session)}
                                  className={`aspect-square flex items-center justify-center text-[10px] p-1 transition-all break-all text-center leading-tight ${
                                    isMarked 
                                      ? 'bg-[#217346] text-white font-bold' 
                                      : isMyTurn 
                                        ? 'bg-white hover:bg-[#e8f0fe] cursor-pointer' 
                                        : 'bg-white opacity-80'
                                  }`}
                                >
                                  {word}
                                </button>
                              );
                            })
                          ))}
                        </div>
                        
                        {/* Strike-through lines overlay */}
                        <svg className="absolute inset-0 pointer-events-none w-full h-full z-20">
                          {(() => {
                            const board = session.bingoGame?.boards[currentUser.uid];
                            const marked = session.bingoGame?.markedWords || [];
                            if (!board) return null;
                            const lines: React.ReactNode[] = [];
                            
                            // Rows
                            for (let r = 0; r < 5; r++) {
                              if (board[r].every(w => marked.includes(w))) {
                                lines.push(<line key={`r-${r}`} x1="5%" y1={`${r * 20 + 10}%`} x2="95%" y2={`${r * 20 + 10}%`} stroke="red" strokeWidth="2" strokeOpacity="0.6" />);
                              }
                            }
                            // Cols
                            for (let c = 0; c < 5; c++) {
                              let colMarked = true;
                              for (let r = 0; r < 5; r++) if (!marked.includes(board[r][c])) colMarked = false;
                              if (colMarked) {
                                lines.push(<line key={`c-${c}`} x1={`${c * 20 + 10}%`} y1="5%" x2={`${c * 20 + 10}%`} y2="95%" stroke="red" strokeWidth="2" strokeOpacity="0.6" />);
                              }
                            }
                            // Diagonals
                            let d1 = true, d2 = true;
                            for (let i = 0; i < 5; i++) {
                              if (!marked.includes(board[i][i])) d1 = false;
                              if (!marked.includes(board[i][4 - i])) d2 = false;
                            }
                            if (d1) lines.push(<line key="d1" x1="5%" y1="5%" x2="95%" y2="95%" stroke="red" strokeWidth="2" strokeOpacity="0.6" />);
                            if (d2) lines.push(<line key="d2" x1="95%" y1="5%" x2="5%" y2="95%" stroke="red" strokeWidth="2" strokeOpacity="0.6" />);
                            
                            return lines;
                          })()}
                        </svg>
                      </div>
                    </div>

                    {/* Game Info */}
                    <div className="w-full md:w-56 space-y-6">
                      <div className="bg-[#f8f9fa] border border-[#d1d1d1] p-4 rounded">
                        <h4 className="text-[9px] font-bold text-[#999] uppercase mb-3 flex items-center gap-2">
                          <Users size={10} /> 플레이어 현황
                        </h4>
                        <div className="space-y-3">
                          {(Object.values(session.players) as Player[]).map(p => {
                            const lines = session.bingoGame?.boards[p.id] ? sessionService.countBingoLines(session.bingoGame.boards[p.id], session.bingoGame.markedWords || []) : 0;
                            return (
                              <div key={p.id} className="flex flex-col gap-1">
                                <div className="flex justify-between items-center text-xs">
                                  <span className={`truncate ${p.id === session.bingoGame?.currentPlayerId ? 'font-bold text-[#217346]' : ''}`}>
                                    {p.nickname}
                                  </span>
                                  <span className="font-mono font-bold text-[#217346]">{lines}줄</span>
                                </div>
                                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-[#217346] transition-all duration-500" 
                                    style={{ width: `${(lines / (session.bingoGame?.targetLines || 5)) * 100}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="bg-white border border-[#d1d1d1] p-3 rounded">
                        <h4 className="text-[9px] font-bold text-[#999] uppercase mb-2">최근 선택된 단어</h4>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {[...(session.bingoGame?.markedWords || [])].reverse().map((word, i) => (
                            <div key={i} className="text-[10px] py-1 border-b border-[#f1f1f1] last:border-0 flex items-center gap-2">
                              <span className="text-[#999] font-mono">{(session.bingoGame?.markedWords || []).length - i}.</span>
                              <span className="font-medium">{word}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#f8f9fa] border-t border-[#d1d1d1] px-4 py-3 text-center text-xs">
                    {session.bingoGame?.currentPlayerId === currentUser.uid ? (
                      <div className="flex items-center justify-center gap-2 text-[#217346] font-bold animate-pulse">
                        <Edit3 size={12} />
                        <span>당신의 차례입니다! 시트에서 단어를 선택하세요.</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-[#666]">
                        <RefreshCw size={12} className="animate-spin" />
                        <span>{session.players[session.bingoGame!.currentPlayerId]?.nickname}님이 단어를 고르는 중...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              )
            ) : session.gameType === GameType.MINESWEEPER ? (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white border border-[#d1d1d1] rounded shadow-lg overflow-hidden">
                  <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-[#666]">데이터_오류_검수_진행</span>
                      <div className="h-3 w-px bg-[#d1d1d1]" />
                      <div className="text-[10px] text-[#666]">난이도: <span className="font-bold text-[#217346]">{session.minesweeperGame?.difficulty}</span></div>
                      <div className="h-3 w-px bg-[#d1d1d1]" />
                      <div className="text-[10px] text-[#666]">남은 지뢰: <span className="font-bold text-red-600">{session.minesweeperGame?.mineCount}</span></div>
                    </div>
                    {session.minesweeperGame?.status !== 'PLAYING' && (
                      <button 
                        onClick={() => sessionService.startMinesweeperGame(session.id, session.minesweeperGame?.difficulty || 'EASY')}
                        className="office-btn-primary px-3 py-1 text-[10px] font-bold"
                      >
                        재시작
                      </button>
                    )}
                  </div>

                  <div className="p-10 md:p-16 flex flex-col items-center gap-10">
                    <div 
                      className="grid gap-1 bg-[#d1d1d1] p-1 rounded shadow-2xl border border-[#d1d1d1]"
                      style={{ 
                        gridTemplateColumns: `repeat(${session.minesweeperGame?.board?.[0]?.length || (session.minesweeperGame?.board && (Object.values(session.minesweeperGame.board)[0] as any)?.length) || 0}, minmax(0, 1fr))`,
                        width: 'fit-content'
                      }}
                    >
                      {(Array.isArray(session.minesweeperGame?.board) ? session.minesweeperGame.board : Object.values(session.minesweeperGame?.board || {})).map((row: any, r: number) => (
                        (Array.isArray(row) ? row : Object.values(row || {})).map((cell: any, c: number) => (
                          <button
                            key={`${r}-${c}`}
                            onClick={() => sessionService.revealMinesweeperCell(session.id, r, c, session)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              sessionService.flagMinesweeperCell(session.id, r, c, session);
                            }}
                            className={`w-6 h-6 md:w-8 md:h-8 flex items-center justify-center text-xs font-bold transition-all ${
                              cell.isRevealed 
                                ? 'bg-[#f1f1f1] text-[#333]' 
                                : 'bg-[#e0e0e0] hover:bg-[#d5d5d5] shadow-[inset_2px_2px_0_rgba(255,255,255,0.5),inset_-2px_-2px_0_rgba(0,0,0,0.1)] active:shadow-none'
                            } ${cell.isMine && cell.isRevealed ? 'bg-red-500 text-white' : ''}`}
                          >
                            {cell.isRevealed ? (
                              cell.isMine ? <Bomb size={14} /> : (cell.neighborMines > 0 ? cell.neighborMines : '')
                            ) : (
                              cell.isFlagged ? <Shield size={14} className="text-red-600" /> : ''
                            )}
                          </button>
                        ))
                      ))}
                    </div>

                    {session.minesweeperGame?.status !== 'PLAYING' && (
                      <div className="w-full max-w-sm space-y-4">
                        {session.minesweeperGame?.status === 'WON' ? (
                          <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center animate-bounce">
                            <Trophy className="mx-auto text-green-600 mb-2" />
                            <p className="text-green-800 font-bold">모든 데이터 오류를 찾아냈습니다! 완벽한 검수입니다.</p>
                          </div>
                        ) : (
                          <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center">
                            <AlertTriangle className="mx-auto text-red-600 mb-2" />
                            <p className="text-red-800 font-bold">치명적인 데이터 오류를 발견하지 못했습니다. 시스템이 충돌했습니다!</p>
                          </div>
                        )}
                        <Leaderboard 
                          entries={session.minesweeperGame?.status === 'WON' || session.minesweeperGame?.status === 'LOST' ? session.leaderboards?.MINESWEEPER || [] : []} 
                          title="데이터 검수" 
                          sessionId={session.id}
                          gameType="MINESWEEPER"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : session.gameType === GameType.OFFICE_2048 ? (
              <div className="max-w-md mx-auto space-y-6">
                <div className="bg-white border border-[#d1d1d1] rounded shadow-lg overflow-hidden">
                  <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-[#666]">직급_승진_프로세스</span>
                    <div className="flex gap-4">
                      <div className="text-[10px] text-[#666]">현재 점수: <span className="font-bold text-[#217346]">{session.office2048Game?.score}</span></div>
                      <div className="text-[10px] text-[#666]">최고 기록: <span className="font-bold text-[#217346]">{session.office2048Game?.bestScore}</span></div>
                    </div>
                  </div>

                  <div className="p-10 md:p-16 flex flex-col items-center gap-10">
                    <div className="grid grid-cols-4 gap-3 bg-[#bbada0] p-3 rounded-xl w-full aspect-square shadow-2xl border-4 border-[#bbada0]">
                      {(Array.isArray(session.office2048Game?.board) ? session.office2048Game.board : Object.values(session.office2048Game?.board || {})).map((row: any, r: number) => (
                        (Array.isArray(row) ? row : Object.values(row || {})).map((val: any, c: number) => {
                          const getRank = (v: number) => {
                            if (v === 0) return '';
                            const ranks: Record<number, string> = {
                              2: '인턴', 4: '사원', 8: '주임', 16: '대리', 32: '과장', 64: '차장',
                              128: '팀장', 256: '부장', 512: '상무', 1024: '전무', 2048: '사장'
                            };
                            return ranks[v] || '고문';
                          };
                          const getColor = (v: number) => {
                            const colors: Record<number, string> = {
                              2: 'bg-[#eee4da] text-[#776e65]',
                              4: 'bg-[#ede0c8] text-[#776e65]',
                              8: 'bg-[#f2b179] text-white',
                              16: 'bg-[#f59563] text-white',
                              32: 'bg-[#f67c5f] text-white',
                              64: 'bg-[#f65e3b] text-white',
                              128: 'bg-[#edcf72] text-white',
                              256: 'bg-[#edcc61] text-white',
                              512: 'bg-[#edc850] text-white',
                              1024: 'bg-[#edc53f] text-white',
                              2048: 'bg-[#edc22e] text-white',
                            };
                            return colors[v] || 'bg-[#cdc1b4]';
                          };
                          return (
                            <div 
                              key={`${r}-${c}`}
                              className={`flex flex-col items-center justify-center rounded transition-all duration-100 ${getColor(val)} shadow-sm`}
                            >
                              <span className="text-lg font-black">{val || ''}</span>
                              <span className="text-[8px] font-bold opacity-80">{getRank(val)}</span>
                            </div>
                          );
                        })
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-2 w-full">
                      <div />
                      <button onClick={() => sessionService.moveOffice2048(session.id, 'UP', session)} className="office-btn py-2 flex justify-center"><ArrowUp size={16} /></button>
                      <div />
                      <button onClick={() => sessionService.moveOffice2048(session.id, 'LEFT', session)} className="office-btn py-2 flex justify-center"><ArrowDown className="-rotate-90" size={16} /></button>
                      <button onClick={() => sessionService.moveOffice2048(session.id, 'DOWN', session)} className="office-btn py-2 flex justify-center"><ArrowDown size={16} /></button>
                      <button onClick={() => sessionService.moveOffice2048(session.id, 'RIGHT', session)} className="office-btn py-2 flex justify-center"><ArrowUp className="rotate-90" size={16} /></button>
                    </div>

                    {session.office2048Game?.status !== 'PLAYING' && (
                      <div className="w-full space-y-4">
                        <div className={`w-full p-4 rounded-lg text-center ${session.office2048Game?.status === 'WON' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                          <p className={`font-bold ${session.office2048Game?.status === 'WON' ? 'text-green-800' : 'text-red-800'}`}>
                            {session.office2048Game?.status === 'WON' ? '축하합니다! 사장으로 승진하셨습니다!' : '승진에 실패했습니다. 다음 기회를 노려보세요.'}
                          </p>
                          <button 
                            onClick={() => sessionService.startOffice2048Game(session.id)}
                            className="mt-2 office-btn-primary px-4 py-1 text-xs"
                          >
                            다시 도전
                          </button>
                        </div>
                        <Leaderboard 
                          entries={session.leaderboards?.OFFICE_2048 || []} 
                          title="직급 승진" 
                          sessionId={session.id}
                          gameType="OFFICE_2048"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : session.gameType === GameType.SUDOKU ? (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white border border-[#d1d1d1] rounded shadow-lg overflow-hidden">
                  <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-[#666]">데이터_무결성_검증_진행</span>
                    <div className="flex gap-4">
                      <div className="text-[10px] text-[#666]">난이도: <span className="font-bold text-[#217346]">{session.sudokuGame?.difficulty}</span></div>
                      <div className="text-[10px] text-[#666]">실수: <span className="font-bold text-red-600">{session.sudokuGame?.mistakes}/3</span></div>
                    </div>
                  </div>

                  <div className="p-10 md:p-16 flex flex-col md:flex-row items-center justify-center gap-12">
                    <div className="grid grid-cols-9 border-4 border-[#333] w-fit shadow-2xl rounded-sm overflow-hidden">
                      {(Array.isArray(session.sudokuGame?.currentBoard) ? session.sudokuGame.currentBoard : Object.values(session.sudokuGame?.currentBoard || {})).map((row: any, r: number) => (
                        (Array.isArray(row) ? row : Object.values(row || {})).map((val: any, c: number) => {
                          const isInitial = session.sudokuGame?.initialBoard?.[r]?.[c] !== 0 && session.sudokuGame?.initialBoard?.[r]?.[c] !== undefined;
                          const isWrong = val !== 0 && val !== undefined && val !== session.sudokuGame?.solution?.[r]?.[c];
                          const isSelected = selectedSudokuCell?.r === r && selectedSudokuCell?.c === c;
                          return (
                            <button 
                              key={`${r}-${c}`}
                              onClick={() => !isInitial && setSelectedSudokuCell({r, c})}
                              className={`w-8 h-8 md:w-10 md:h-10 border border-[#ccc] flex items-center justify-center text-sm md:text-base font-bold transition-all
                                ${r % 3 === 2 && r !== 8 ? 'border-b-2 border-b-[#333]' : ''}
                                ${c % 3 === 2 && c !== 8 ? 'border-r-2 border-r-[#333]' : ''}
                                ${isInitial ? 'bg-[#f8f9fa] text-[#333]' : 'bg-white text-[#217346]'}
                                ${isWrong ? 'bg-red-100 text-red-600' : ''}
                                ${isSelected ? 'ring-2 ring-inset ring-[#217346] bg-[#e8f0fe] z-10' : ''}
                              `}
                            >
                              {val || ''}
                            </button>
                          );
                        })
                      ))}
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-3 gap-2">
                        {[1,2,3,4,5,6,7,8,9].map(num => (
                          <button 
                            key={num}
                            onClick={() => {
                              if (selectedSudokuCell) {
                                sessionService.updateSudokuCell(session.id, selectedSudokuCell.r, selectedSudokuCell.c, num, session);
                              }
                            }}
                            className="office-btn w-10 h-10 font-bold"
                          >
                            {num}
                          </button>
                        ))}
                        <button 
                          onClick={() => {
                            if (selectedSudokuCell) {
                              sessionService.updateSudokuCell(session.id, selectedSudokuCell.r, selectedSudokuCell.c, 0, session);
                            }
                          }}
                          className="office-btn w-10 h-10 font-bold text-red-600"
                        >
                          X
                        </button>
                      </div>
                      <button 
                        onClick={() => sessionService.startSudokuGame(session.id, session.sudokuGame?.difficulty || 'EASY')}
                        className="office-btn-primary py-2 text-xs font-bold"
                      >
                        새 시트
                      </button>
                    </div>
                    {session.sudokuGame?.status === 'WON' && (
                      <div className="w-full max-w-xs space-y-4">
                        <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center animate-bounce">
                          <Trophy className="mx-auto text-green-600 mb-2" />
                          <p className="text-green-800 font-bold">데이터 무결성 검증 완료! 완벽한 보고서입니다.</p>
                        </div>
                        <Leaderboard 
                          entries={session.leaderboards?.SUDOKU || []} 
                          title="데이터 무결성" 
                          sessionId={session.id}
                          gameType="SUDOKU"
                        />
                      </div>
                    )}
                  </div>
                  
                  <p className="text-center text-[10px] text-[#999] pb-4">빈 칸을 클릭하고 숫자를 입력하여 데이터를 검증하세요.</p>
                </div>
              </div>
            ) : session.gameType === GameType.DRAW ? (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-white border border-[#d1d1d1] rounded shadow-lg overflow-hidden">
                  <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-[#666]">비주얼_브리핑_진행</span>
                      <div className="h-3 w-px bg-[#d1d1d1]" />
                      <div className="text-[10px] text-[#666]">라운드: <span className="font-bold text-[#217346]">{session.drawGame?.round} / {session.drawGame?.maxRounds}</span></div>
                      <div className="h-3 w-px bg-[#d1d1d1]" />
                      <div className="text-[10px] font-bold text-[#217346] tracking-widest">
                        힌트: {(() => {
                          const word = session.drawGame?.word || '';
                          const timer = session.drawGame?.timer || 0;
                          const maxTime = session.settings.drawTime || 60;
                          if (session.drawGame?.presenterId === currentUser.uid) return word;
                          
                          // Hint logic:
                          // 50% time left: Show first char
                          // 25% time left: Show first two chars
                          let hint = '';
                          for (let i = 0; i < word.length; i++) {
                             if (word[i] === ' ') hint += '  '; // Double space for word separation
                             else hint += '_ ';
                          }

                          if (timer < maxTime * 0.5 && word.length > 0) {
                            // Reveal first char
                            hint = word[0] + hint.substring(2);
                          }
                          if (timer < maxTime * 0.25 && word.length > 1) {
                            // Reveal second char
                            hint = word[0] + ' ' + word[1] + hint.substring(4);
                          }
                          return hint;
                        })()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-red-600">
                      <Timer size={14} />
                      <span>{session.drawGame?.timer}s</span>
                    </div>
                  </div>

                  <div className="p-6 md:p-10 flex flex-col lg:flex-row gap-10">
                    {/* Canvas Area */}
                    <div className="flex-1 flex flex-col gap-4 min-w-0">
                      <div className="flex flex-col gap-3">
                        {session.drawGame?.presenterId === currentUser.uid && (
                          <div className="bg-[#217346] text-white px-4 py-3 rounded-lg flex justify-between items-center shadow-md border-b-4 border-[#1a5a36]">
                            <div className="flex items-center gap-3 font-bold text-base md:text-lg">
                              <Palette size={20} className="text-yellow-300" />
                              <span>제시어: <span className="text-yellow-300 font-black ml-1">{session.drawGame?.word}</span></span>
                            </div>
                            <button 
                              onClick={() => sessionService.passDrawTurn(session.id, session)}
                              className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 active:scale-95"
                            >
                              <RefreshCw size={14} /> 패스하기
                            </button>
                          </div>
                        )}
                        <div className="relative bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-lg">
                          <Canvas 
                            isPresenter={session.drawGame?.presenterId === currentUser.uid}
                            onDraw={(data) => sessionService.updateDrawCanvas(session.id, data)}
                            initialData={session.drawGame?.canvasData}
                          />
                        </div>
                      </div>
                      
                      {session.drawGame?.presenterId !== currentUser.uid && (
                        <div className="flex gap-2 w-full max-w-2xl mx-auto">
                          <input 
                            type="text"
                            placeholder="정답을 입력하세요..."
                            className="office-input flex-1 h-12 text-base shadow-sm"
                            value={drawGuess}
                            onChange={(e) => setDrawGuess(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && drawGuess.trim()) {
                                sessionService.submitDrawGuess(session.id, currentUser.uid, drawGuess.trim(), session);
                                setDrawGuess('');
                              }
                            }}
                          />
                          <button 
                            onClick={() => {
                              if (drawGuess.trim()) {
                                sessionService.submitDrawGuess(session.id, currentUser.uid, drawGuess.trim(), session);
                                setDrawGuess('');
                              }
                            }}
                            className="office-btn-primary px-6 h-12 font-bold shadow-sm whitespace-nowrap"
                          >
                            제출
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Sidebar */}
                    <div className="w-full lg:w-64 space-y-4 shrink-0">
                      <div className="bg-[#f8f9fa] border border-[#d1d1d1] p-4 rounded shadow-sm">
                        <h4 className="text-[10px] font-bold text-[#999] uppercase mb-3 flex items-center gap-2">
                          <Trophy size={12} /> 실시간 스코어보드
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {Object.entries(session.drawGame?.scores || {}).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([pid, score]) => (
                            <div key={pid} className="flex justify-between items-center text-xs p-1 hover:bg-gray-100 rounded">
                              <div className="flex items-center gap-2 truncate flex-1">
                                {pid === session.drawGame?.presenterId && <Palette size={12} className="text-[#217346]" />}
                                <span className={`truncate ${pid === currentUser.uid ? 'font-bold text-[#217346]' : 'text-gray-700'}`}>
                                  {session.players[pid]?.nickname}
                                </span>
                              </div>
                              <span className="font-mono font-bold bg-gray-200 px-1.5 py-0.5 rounded text-[10px]">{score}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white border border-[#d1d1d1] p-4 rounded shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#e8f0fe] rounded-full flex items-center justify-center text-[#217346] shrink-0">
                          <User size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-bold text-[#999] uppercase mb-0.5">현재 발표자</div>
                          <div className="text-sm font-bold truncate text-gray-800">{session.players[session.drawGame!.presenterId]?.nickname}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#f8f9fa] border-t border-[#d1d1d1] px-4 py-3 text-center text-xs">
                    {session.drawGame?.presenterId === currentUser.uid ? (
                      <div className="flex items-center justify-center gap-2 text-[#217346] font-bold animate-pulse">
                        <Palette size={12} />
                        <span>당신은 발표자입니다! 화이트보드에 제시어를 그려주세요.</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-[#666]">
                        <Search size={12} className="animate-bounce" />
                        <span>발표자의 그림을 보고 정답을 맞혀보세요!</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
            <div className="space-y-6">
              {session.gameType === GameType.MAFIA && session.mafiaGame?.nightResult && (
                <div className="bg-slate-800 text-white p-4 rounded shadow-md border-l-4 border-slate-500">
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Moon size={12} /> 지난 밤의 소식
                  </h3>
                  <div className="space-y-2 text-sm">
                    {session.mafiaGame.nightResult.eliminatedPlayerId ? (
                      <p>
                        안타깝게도 <span className="font-bold text-red-400">{session.players[session.mafiaGame.nightResult.eliminatedPlayerId].nickname}</span>님이 마피아에 의해 희생되었습니다.
                      </p>
                    ) : (
                      <p className="text-green-400">지난 밤에는 아무도 희생되지 않았습니다.</p>
                    )}
                    
                    {/* Only show investigation result to the police who investigated */}
                    {me?.role === MafiaRole.POLICE && session.mafiaGame.nightResult.investigatedPlayerId && (
                      <div className="mt-2 pt-2 border-t border-slate-600 text-xs">
                        <p className="text-blue-300">
                          <span className="font-bold">조사 결과: </span>
                          {session.players[session.mafiaGame.nightResult.investigatedPlayerId].nickname}님은 
                          <span className={`font-bold ${session.mafiaGame.nightResult.investigatedRole === MafiaRole.MAFIA ? 'text-red-400' : 'text-green-400'}`}>
                            {session.mafiaGame.nightResult.investigatedRole === MafiaRole.MAFIA ? ' 마피아' : ' 마피아가 아닙니다'}
                          </span>.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-white border border-[#d1d1d1] p-4 rounded shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <div>
                    <h3 className="text-[10px] font-bold text-[#666]">세션_활성화됨</h3>
                    <p className="text-sm font-bold">토론이 진행 중입니다...</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {session.gameType === GameType.LIAR && (
                    <div className="relative">
                      <button
                        onClick={() => setShowLiarKeyword(!showLiarKeyword)}
                        className={`office-btn px-3 py-2 text-xs flex items-center justify-center gap-1 whitespace-nowrap ${showLiarKeyword ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : ''}`}
                        title="제시어 다시 확인하기"
                      >
                        {showLiarKeyword ? <Sun size={12} /> : <Moon size={12} />}
                        <span>{showLiarKeyword ? '제시어 숨기기' : '제시어 확인'}</span>
                      </button>
                      {showLiarKeyword && (
                        <div className="absolute top-full right-0 mt-2 p-3 bg-white border border-yellow-300 shadow-xl rounded z-50 min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
                          <div className="text-[10px] text-gray-500 mb-1 font-bold flex items-center gap-1">
                            <AlertTriangle size={10} className="text-yellow-500" /> 보안 주의
                          </div>
                          <div className="text-center py-2">
                            {session.liarGame?.liarPlayerId === currentUser.uid ? (
                              session.liarGame?.mode === LiarMode.FOOL ? (
                                <div className="flex flex-col items-center">
                                  <span className="text-red-600 font-black text-lg">{session.liarGame?.liarWord}</span>
                                  <span className="text-[9px] text-red-400 font-bold">(바보 라이어 단어)</span>
                                </div>
                              ) : (
                                <span className="text-red-600 font-black text-lg">당신은 라이어입니다</span>
                              )
                            ) : (
                              <span className="text-[#217346] font-black text-lg">{session.liarGame?.commonWord}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {isHost && (
                    <button 
                      onClick={() => sessionService.shuffleTurnOrder(session.id, session.players)}
                      className="office-btn px-3 py-2 text-xs flex items-center justify-center gap-1 whitespace-nowrap"
                      title="발언 순서 섞기"
                    >
                      <RefreshCw size={12} />
                      <span>순서 섞기</span>
                    </button>
                  )}
                  {isHost && (
                    <button 
                      onClick={() => sessionService.advanceStatus(session.id, SessionStatus.VOTING)}
                      className="office-btn-primary px-4 py-2 text-xs whitespace-nowrap flex-1 sm:flex-none"
                    >
                      투표_단계로_전환
                    </button>
                  )}
                </div>
              </div>

              {/* Turn Order Display */}
              {session.turnOrder && session.turnOrder.length > 0 && (
                <div className="bg-white border border-[#d1d1d1] rounded shadow-sm overflow-hidden">
                  <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 text-[10px] font-bold text-[#666] flex items-center gap-2">
                    <ListOrdered size={12} />
                    발언_순서
                  </div>
                  <div className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {session.turnOrder.map((pid, idx) => {
                        const player = session.players[pid];
                        if (!player) return null;
                        const isAlive = player.isAlive;
                        return (
                          <div 
                            key={pid} 
                            className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-colors ${
                              !isAlive 
                                ? 'bg-gray-100 text-gray-400 border-gray-200 line-through decoration-gray-400' 
                                : pid === currentUser?.uid
                                  ? 'bg-[#e8f0fe] border-[#217346] text-[#217346] font-bold shadow-sm'
                                  : 'bg-white border-[#d1d1d1] text-[#333]'
                            }`}
                          >
                            <span className={`text-[10px] font-mono w-4 text-center ${pid === currentUser?.uid ? 'text-[#217346]' : 'text-[#999]'}`}>
                              {idx + 1}
                            </span>
                            <span className="text-xs">{player.nickname}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="excel-grid rounded overflow-hidden shadow-sm">
                <table className="excel-grid">
                  <thead>
                    <tr>
                      <th className="w-8"></th>
                      <th className="text-left pl-4">사용자_이름</th>
                      <th className="w-24">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.values(session.players) as Player[]).map((p, idx) => (
                      <tr key={p.id}>
                        <td className="bg-[#f8f9fa] border-r border-b border-[#d1d1d1] text-[9px] font-bold text-[#999] text-center">{idx + 1}</td>
                        <td className="excel-cell font-medium">{p.nickname}</td>
                        <td className="excel-cell text-center">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full ${p.isAlive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {p.isAlive ? '활성' : '제거됨'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

          {session.status === SessionStatus.VOTING && (
            <div className="max-w-xl mx-auto">
              <div className="bg-white border border-[#d1d1d1] rounded shadow-lg overflow-hidden">
                <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 text-[10px] font-bold text-[#666]">
                  투표_제출_양식
                </div>
                <div className="p-6 space-y-6">
                  <p className="text-xs text-[#666] text-center">의심되는 대상을 선택하여 투표를 제출하십시오.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(Object.values(session.players) as Player[]).filter(p => p.isAlive).map(p => (
                      <button
                        key={p.id}
                        disabled={me?.voteTarget !== undefined || !me?.isAlive}
                        onClick={() => setSelectedVoteTarget(p.id)}
                        className={`p-2 border text-xs font-medium transition-all text-left px-4 rounded ${
                          (me?.voteTarget === p.id || selectedVoteTarget === p.id)
                            ? 'bg-[#f1f8f5] text-[#217346] border-[#217346]' 
                            : 'bg-white text-[#333] border-[#d1d1d1] hover:bg-[#f8f9fa]'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{p.nickname}</span>
                          {(me?.voteTarget === p.id || selectedVoteTarget === p.id) && <CheckCircle2 size={12} />}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-[#d1d1d1] flex flex-col items-center gap-4">
                    {me?.voteTarget ? (
                      <div className="text-center">
                        <div className="animate-pulse text-sm font-bold text-gray-500">투표 완료! 다른 플레이어 대기 중...</div>
                        <div className="text-[10px] text-gray-400 mt-1">
                          {(Object.values(session.players) as Player[]).filter(p => p.isAlive && p.voteTarget).length} / {(Object.values(session.players) as Player[]).filter(p => p.isAlive).length} 명 투표 완료
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => {
                          if (selectedVoteTarget) {
                            sessionService.submitVote(session.id, currentUser.uid, selectedVoteTarget);
                            setSelectedVoteTarget(null);
                          }
                        }}
                        disabled={!selectedVoteTarget || !me?.isAlive}
                        className="office-btn-primary px-8 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        투표_제출
                      </button>
                    )}

                    {isHost && (
                      <button 
                        onClick={() => {
                          if (confirm('투표를 강제로 종료하시겠습니까? 투표하지 않은 플레이어는 기권 처리됩니다.')) {
                            if (session.gameType === GameType.LIAR && session.liarGame) {
                              sessionService.processLiarVote(session.id, session.players, session.liarGame);
                            } else if (session.gameType === GameType.MAFIA) {
                              sessionService.processMafiaVote(session.id, session.players);
                            }
                          }
                        }}
                        className="text-xs text-red-500 underline hover:text-red-700"
                      >
                        강제 투표 종료 (미투표자 무시)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {session.status === SessionStatus.VOTE_RESULT && (
            <div className="max-w-xl mx-auto">
              <div className="bg-white border border-[#d1d1d1] rounded shadow-lg overflow-hidden">
                <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 text-[10px] font-bold text-[#666]">
                  투표_결과_보고서
                </div>
                <div className="p-8 space-y-8 text-center">
                  {session.gameType === GameType.LIAR ? (
                    session.liarGame?.lastVotedPlayerId ? (
                      <>
                        <div className="space-y-2">
                          <div className="text-xs text-[#666]">최다 득표자:</div>
                          <div className="text-3xl font-black text-[#333]">
                            {session.players[session.liarGame!.lastVotedPlayerId]?.nickname || '알 수 없음'}
                          </div>
                        </div>
                        
                        <div className="py-6 border-y border-[#d1d1d1] bg-[#f8f9fa] rounded">
                          <div className="text-xs text-[#666] mb-2 uppercase tracking-widest">정체 확인 결과</div>
                          {session.liarGame!.lastVotedPlayerId === session.liarGame!.liarPlayerId ? (
                            <div className="space-y-2">
                              <div className="text-4xl font-black text-[#217346]">
                                라이어 검거 성공!
                              </div>
                              <p className="text-xs text-[#666]">해당 플레이어는 라이어가 맞습니다.</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-4xl font-black text-red-600">
                                라이어가 아닙니다
                              </div>
                              <p className="text-xs text-[#666]">해당 플레이어는 선량한 시민이었습니다.</p>
                            </div>
                          )}
                        </div>

                        {isHost ? (
                          <div className="pt-4 space-y-3">
                            {session.liarGame!.lastVotedPlayerId === session.liarGame!.liarPlayerId ? (
                               <button 
                                onClick={() => sessionService.advanceStatus(session.id, SessionStatus.SUMMARY)}
                                className="office-btn-primary w-full py-3 shadow-md hover:shadow-lg transition-all"
                              >
                                최종_결과_보기
                              </button>
                            ) : (
                              <button 
                                onClick={() => sessionService.advanceStatus(session.id, SessionStatus.PLAYING)}
                                className="office-btn-primary w-full py-3 shadow-md hover:shadow-lg transition-all"
                              >
                                시트_계속하기 (다음 라운드)
                              </button>
                            )}
                            <p className="text-[10px] text-[#999]">관리자만 진행할 수 있습니다.</p>
                          </div>
                        ) : (
                          <div className="text-center p-4 bg-gray-50 rounded border border-gray-100">
                            <div className="animate-pulse text-xs font-bold text-gray-500">관리자가 다음 단계를 진행하기를 기다리는 중...</div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-[#666]">투표 결과가 없습니다.</p>
                         {isHost && (
                          <button 
                            onClick={() => sessionService.advanceStatus(session.id, SessionStatus.PLAYING)}
                            className="office-btn w-full py-2"
                          >
                            돌아가기
                          </button>
                        )}
                      </div>
                    )
                  ) : (
                    // Mafia Game Vote Result
                    <>
                      {session.mafiaGame?.eliminatedPlayerId ? (
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <div className="text-xs text-[#666]">투표로 처형된 플레이어:</div>
                            <div className="text-3xl font-black text-red-600">
                              {session.players[session.mafiaGame.eliminatedPlayerId]?.nickname || '알 수 없음'}
                            </div>
                          </div>
                          
                          <div className="py-4 border-y border-[#d1d1d1] bg-[#f8f9fa] rounded">
                            <p className="text-sm text-[#666]">
                              <span className="font-bold">{session.players[session.mafiaGame.eliminatedPlayerId]?.nickname}</span>님이 시트에서 제외되었습니다.
                            </p>
                            {/* Optional: Reveal role */}
                            <p className="text-xs text-[#999] mt-2">
                              그의 정체는 <span className="font-bold">{session.players[session.mafiaGame.eliminatedPlayerId]?.role === 'MAFIA' ? '마피아' : '시민(또는 특수직)'}</span>였습니다.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="text-2xl font-bold text-[#333]">투표 부결</div>
                          <p className="text-sm text-[#666]">동점표가 발생하여 아무도 처형되지 않았습니다.</p>
                        </div>
                      )}

                      {isHost ? (
                        <div className="pt-4 space-y-3">
                          <button 
                            onClick={() => sessionService.startNightPhase(session.id, session.players)}
                            className="office-btn-primary w-full py-3 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                          >
                            <Moon size={16} />
                            <span>밤이 되었습니다 (다음 단계)</span>
                          </button>
                          <p className="text-[10px] text-[#999]">관리자만 진행할 수 있습니다.</p>
                        </div>
                      ) : (
                        <div className="text-center p-4 bg-gray-50 rounded border border-gray-100">
                          <div className="animate-pulse text-xs font-bold text-gray-500">관리자가 밤 단계를 시작하기를 기다리는 중...</div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {session.status === SessionStatus.NIGHT && (
            <div className="max-w-xl mx-auto">
              <div className="bg-slate-900 text-white border border-slate-700 rounded shadow-xl overflow-hidden">
                <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 text-[10px] font-bold text-slate-400 flex justify-between items-center">
                  <span>NIGHT_PHASE_EXECUTION</span>
                  <Moon size={12} />
                </div>
                <div className="p-8 space-y-8">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">밤이 되었습니다</h2>
                    <p className="text-sm text-slate-400">마피아는 고개를 들어주세요...</p>
                  </div>

                  {me?.isAlive ? (
                    <div className="space-y-6">
                      {me.role === MafiaRole.MAFIA && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-red-400 justify-center">
                            <Siren size={20} />
                            <span className="font-bold">마피아 임무: 제거할 대상을 선택하세요</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {(Object.values(session.players) as Player[]).filter(p => p.isAlive && p.id !== me.id).map(p => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  setSelectedNightTarget(p.id);
                                  sessionService.submitNightAction(session.id, me.id, MafiaRole.MAFIA, p.id);
                                }}
                                className={`p-3 rounded border text-sm transition-all ${
                                  session.mafiaGame?.mafiaTargets?.[me.id] === p.id
                                    ? 'bg-red-900/50 border-red-500 text-red-200'
                                    : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                                }`}
                              >
                                {p.nickname}
                                {session.mafiaGame?.mafiaTargets && Object.values(session.mafiaGame.mafiaTargets).includes(p.id) && (
                                  <span className="block text-[9px] text-red-400 mt-1">동료가 선택함</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {me.role === MafiaRole.DOCTOR && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-green-400 justify-center">
                            <Stethoscope size={20} />
                            <span className="font-bold">의사 임무: 치료할 대상을 선택하세요</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {(Object.values(session.players) as Player[]).filter(p => p.isAlive).map(p => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  setSelectedNightTarget(p.id);
                                  sessionService.submitNightAction(session.id, me.id, MafiaRole.DOCTOR, p.id);
                                }}
                                className={`p-3 rounded border text-sm transition-all ${
                                  session.mafiaGame?.doctorTarget === p.id
                                    ? 'bg-green-900/50 border-green-500 text-green-200'
                                    : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                                }`}
                              >
                                {p.nickname}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {me.role === MafiaRole.POLICE && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-blue-400 justify-center">
                            <Search size={20} />
                            <span className="font-bold">경찰 임무: 조사할 대상을 선택하세요</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {(Object.values(session.players) as Player[]).filter(p => p.isAlive && p.id !== me.id).map(p => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  setSelectedNightTarget(p.id);
                                  sessionService.submitNightAction(session.id, me.id, MafiaRole.POLICE, p.id);
                                }}
                                className={`p-3 rounded border text-sm transition-all ${
                                  session.mafiaGame?.policeTarget === p.id
                                    ? 'bg-blue-900/50 border-blue-500 text-blue-200'
                                    : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                                }`}
                              >
                                {p.nickname}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {me.role === MafiaRole.CITIZEN && (
                        <div className="text-center py-8 text-slate-500">
                          <Moon size={48} className="mx-auto mb-4 opacity-20" />
                          <p>시민은 밤에 할 수 있는 행동이 없습니다.</p>
                          <p className="text-xs mt-2">아침이 밝을 때까지 기다려주세요.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <p>당신은 이미 사망했습니다.</p>
                      <p className="text-xs mt-2">시트 진행을 지켜봐주세요.</p>
                    </div>
                  )}

                  {isHost && (
                    <div className="pt-6 border-t border-slate-700">
                      <button 
                        onClick={() => sessionService.processNightPhase(session.id, session.players, session.mafiaGame!)}
                        className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <Sun size={16} />
                        <span>아침을 시작합니다 (결과 처리)</span>
                      </button>
                      <p className="text-[10px] text-slate-500 text-center mt-2">모든 플레이어가 행동을 마쳤는지 확인하세요.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {session.status === SessionStatus.SUMMARY && (
            <div className="max-w-xl mx-auto">
              <div className="bg-white border border-[#d1d1d1] rounded shadow-xl overflow-hidden">
                <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 text-[10px] font-bold text-[#666]">
                  최종_세션_보고서
                </div>
                <div className="p-8 space-y-8">
                  <div className="text-center space-y-4">
                    <h3 className="text-[10px] font-bold text-[#999] uppercase tracking-widest">감사 결과</h3>
                    
                    <div className="py-6 border-y border-[#d1d1d1] space-y-4">
                      {session.gameType === GameType.DRAW ? (
                        <div className="space-y-6">
                          <div className="text-xs text-[#666]">최종 스코어 결과:</div>
                          <div className="grid grid-cols-1 gap-3">
                            {Object.entries(session.drawGame?.scores || {}).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([pid, score], i) => (
                              <div key={pid} className={`flex items-center justify-between p-4 rounded border ${i === 0 ? 'bg-[#e8f0fe] border-[#217346]' : 'bg-[#f8f9fa] border-[#d1d1d1]'}`}>
                                <div className="flex items-center gap-4">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${i === 0 ? 'bg-[#217346] text-white' : 'bg-gray-200 text-gray-600'}`}>
                                    {i + 1}
                                  </div>
                                  <span className="font-bold">{session.players[pid]?.nickname}</span>
                                </div>
                                <div className="text-xl font-black text-[#217346]">{score}점</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : session.gameType === GameType.BINGO ? (
                        <div className="space-y-4">
                          <div className="text-xs text-[#666]">최종 승리자:</div>
                          <div className="text-4xl font-black text-[#217346]">
                            {session.players[session.bingoGame!.winner!]?.nickname}
                          </div>
                          <div className="py-4 bg-[#f8f9fa] rounded border border-[#d1d1d1] inline-block px-8">
                            <div className="text-[10px] text-[#999] uppercase mb-1">달성 기록</div>
                            <div className="text-xl font-bold text-[#333]">
                              {sessionService.countBingoLines(session.bingoGame!.boards[session.bingoGame!.winner!], session.bingoGame!.markedWords)}줄 완성
                            </div>
                          </div>
                        </div>
                      ) : session.gameType === GameType.OMOK ? (
                        <div className="space-y-4">
                          <div className="text-xs text-[#666]">승리:</div>
                          {session.omokGame?.isDraw ? (
                            <div className="text-3xl font-black text-[#666]">무승부</div>
                          ) : (
                            <div className="text-3xl font-black text-[#217346]">
                              {session.players[session.omokGame!.winner!].nickname} 승리!
                            </div>
                          )}
                          
                          <div className="flex justify-center gap-8 mt-6">
                            <div className={`text-center p-4 rounded border ${session.omokGame?.winner === session.omokGame?.blackPlayerId ? 'bg-black/5 border-black' : 'border-transparent'}`}>
                              <div className="w-12 h-12 rounded-full bg-black mx-auto mb-2 shadow-lg flex items-center justify-center text-white font-bold text-xs border-2 border-white/20">흑</div>
                              <div className="text-sm font-bold">{session.players[session.omokGame!.blackPlayerId].nickname}</div>
                              {session.omokGame?.winner === session.omokGame?.blackPlayerId && <div className="text-[10px] text-[#217346] font-bold mt-1">WINNER</div>}
                            </div>
                            <div className={`text-center p-4 rounded border ${session.omokGame?.winner === session.omokGame?.whitePlayerId ? 'bg-gray-100 border-gray-400' : 'border-transparent'}`}>
                              <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-300 mx-auto mb-2 shadow-lg flex items-center justify-center text-black font-bold text-xs">백</div>
                              <div className="text-sm font-bold">{session.players[session.omokGame!.whitePlayerId].nickname}</div>
                              {session.omokGame?.winner === session.omokGame?.whitePlayerId && <div className="text-[10px] text-[#217346] font-bold mt-1">WINNER</div>}
                            </div>
                          </div>
                        </div>
                      ) : session.gameType === GameType.LIAR ? (
                        <div className="space-y-4">
                          {session.liarGame?.winner === 'LIAR' ? (
                            <div className="space-y-2">
                              <div className="text-xs text-[#666]">승리:</div>
                              <div className="text-4xl font-black text-red-600">라이어 승리!</div>
                              <div className="text-sm text-[#666]">
                                라이어는 <span className="font-bold text-[#333]">{session.players[session.liarGame!.liarPlayerId].nickname}</span> 였습니다.
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-xs text-[#666]">식별된 라이어:</div>
                              <div className="text-3xl font-black text-[#217346]">
                                {session.players[session.liarGame!.liarPlayerId].nickname}
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col items-center gap-2">
                            {session.liarGame?.mode === LiarMode.FOOL ? (
                              <div className="w-full space-y-2">
                                <div className="text-[10px] text-[#666] bg-[#f8f9fa] p-2 rounded flex justify-between items-center border border-[#d1d1d1]">
                                  <span className="font-bold uppercase tracking-tighter">시민 제시어</span>
                                  <span className="text-sm font-black text-[#217346]">{session.liarGame?.commonWord}</span>
                                </div>
                                <div className="text-[10px] text-[#666] bg-[#fff1f2] p-2 rounded flex justify-between items-center border border-red-100">
                                  <span className="font-bold uppercase tracking-tighter">바보 제시어</span>
                                  <span className="text-sm font-black text-red-600">{session.liarGame?.liarWord}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-[10px] text-[#666] bg-[#f8f9fa] p-2 w-full rounded flex justify-between items-center border border-[#d1d1d1]">
                                <span className="font-bold uppercase tracking-tighter">정답 제시어</span>
                                <span className="text-sm font-black text-[#333]">{session.liarGame?.commonWord}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-xs text-[#666]">식별된 마피아:</div>
                          <div className="text-3xl font-black text-red-600">
                            {(Object.values(session.players) as Player[]).filter(p => p.role === 'MAFIA').map(p => p.nickname).join(', ')}
                          </div>
                          {session.mafiaGame?.winner && (
                            <div className="mt-4 space-y-2">
                              <div className={`p-2 text-xs font-bold border rounded ${
                                session.mafiaGame.winner === 'MAFIA' 
                                  ? 'bg-red-50 text-red-600 border-red-200' 
                                  : 'bg-green-50 text-green-600 border-green-200'
                              }`}>
                                {session.mafiaGame.winner === 'MAFIA' ? '마피아_승리' : '시민_승리'}
                              </div>
                              <p className="text-[10px] text-[#666]">
                                {session.mafiaGame.winner === 'MAFIA' 
                                  ? '마피아의 수가 시민의 수보다 많아져서 마피아가 승리했습니다.' 
                                  : '모든 마피아가 제거되어 시민이 승리했습니다.'}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[9px] font-bold text-[#999] uppercase tracking-widest">전체 감사 로그</h4>
                    <div className="excel-grid rounded overflow-hidden">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-[#f8f9fa]">
                            <th className="excel-col-header w-8">#</th>
                            <th className="excel-col-header text-left pl-4">사용자</th>
                            <th className="excel-col-header">역할</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(Object.values(session.players) as Player[]).map((p, idx) => (
                            <tr key={p.id}>
                              <td className="bg-[#f8f9fa] border-r border-b border-[#d1d1d1] text-[9px] font-bold text-[#999] text-center">{idx + 1}</td>
                              <td className="excel-cell text-xs">{p.nickname}</td>
                              <td className={`excel-cell text-xs font-bold text-center ${
                                session.gameType === GameType.OMOK ? (
                                  p.id === session.omokGame?.blackPlayerId ? 'text-black' : 
                                  p.id === session.omokGame?.whitePlayerId ? 'text-gray-500' : 'text-[#999]'
                                ) :
                                p.role === 'MAFIA' || p.id === session.liarGame?.liarPlayerId ? 'text-red-600' : 
                                p.role === 'DOCTOR' ? 'text-green-600' :
                                p.role === 'POLICE' ? 'text-blue-600' : 'text-[#217346]'
                              }`}>
                                {session.gameType === GameType.MAFIA ? (
                                  p.role === 'MAFIA' ? '마피아' :
                                  p.role === 'DOCTOR' ? '의사' :
                                  p.role === 'POLICE' ? '경찰' : '시민'
                                ) : session.gameType === GameType.OMOK ? (
                                  p.id === session.omokGame?.blackPlayerId ? '흑돌' :
                                  p.id === session.omokGame?.whitePlayerId ? '백돌' : '관전'
                                ) : (
                                  p.id === session.liarGame?.liarPlayerId ? '라이어' :
                                  p.id === session.liarGame?.spyPlayerId ? '스파이' : '시민'
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {isHost && (
                    <button 
                      onClick={() => sessionService.resetSession(session.id, session.players)}
                      className="office-btn-primary w-full py-3"
                    >
                      세션_재시작
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
            </>
          ) : activeSheet === 'ROLES' ? (
            <div className="bg-white border border-[#d1d1d1] rounded shadow-sm overflow-hidden">
              <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 text-[10px] font-bold text-[#666]">
                역할_할당_데이터베이스
              </div>
              <div className="overflow-x-auto">
                <table className="excel-grid">
                  <thead>
                    <tr>
                      <th className="w-8"></th>
                      <th className="text-left pl-4">플레이어</th>
                      <th className="w-32">할당된_역할</th>
                      <th className="w-24">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.values(session.players) as Player[]).map((p, idx) => (
                      <tr key={p.id}>
                        <td className="bg-[#f8f9fa] border-r border-b border-[#d1d1d1] text-[9px] font-bold text-[#999] text-center">{idx + 1}</td>
                        <td className="excel-cell">{p.nickname}</td>
                        <td className="excel-cell text-center font-bold">
                          {session.status === SessionStatus.LOBBY ? '대기 중' : (p.role || '시민')}
                        </td>
                        <td className="excel-cell text-center">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full ${p.isAlive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {p.isAlive ? '활성' : '제거됨'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeSheet === 'LOGS' ? (
            <div className="bg-white border border-[#d1d1d1] rounded shadow-sm overflow-hidden">
              <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 text-[10px] font-bold text-[#666] flex justify-between items-center">
                <span>시스템_이벤트_로그</span>
                <span className="text-[9px] font-normal">총 {Object.keys(session.logs || {}).length}개의 레코드</span>
              </div>
              <div className="overflow-x-auto">
                <table className="excel-grid">
                  <thead>
                    <tr>
                      <th className="w-8"></th>
                      <th className="w-32 text-left pl-4">타임스탬프</th>
                      <th className="w-20 text-center">유형</th>
                      <th className="text-left pl-4">이벤트_내용</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.values(session.logs || {}) as GameLog[]).sort((a, b) => b.timestamp - a.timestamp).map((log, idx) => (
                      <tr key={log.id}>
                        <td className="bg-[#f8f9fa] border-r border-b border-[#d1d1d1] text-[9px] font-bold text-[#999] text-center">{idx + 1}</td>
                        <td className="excel-cell font-mono text-[10px]">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="excel-cell text-center">
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            log.type === 'success' ? 'bg-green-100 text-green-700' :
                            log.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {log.type}
                          </span>
                        </td>
                        <td className={`excel-cell ${log.type === 'success' ? 'text-green-700 font-medium' : ''}`}>
                          {log.content}
                        </td>
                      </tr>
                    ))}
                    {Object.keys(session.logs || {}).length === 0 && (
                      <tr>
                        <td colSpan={4} className="excel-cell text-center py-8 text-gray-400 italic">
                          기록된 로그가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeSheet === 'STATS' ? (
            <div className="bg-white border border-[#d1d1d1] rounded shadow-sm overflow-hidden">
              <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 text-[10px] font-bold text-[#666]">
                세션_성과_지표_대시보드
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-[#e8f0fe] border border-[#217346] p-4 rounded">
                    <div className="text-[9px] text-[#217346] font-bold uppercase mb-1">총 라운드</div>
                    <div className="text-2xl font-black text-[#217346]">{session.round}</div>
                  </div>
                  <div className="bg-[#f8f9fa] border border-[#d1d1d1] p-4 rounded">
                    <div className="text-[9px] text-[#666] font-bold uppercase mb-1">참여 인원</div>
                    <div className="text-2xl font-black text-[#333]">{Object.keys(session.players).length}</div>
                  </div>
                  <div className="bg-[#f8f9fa] border border-[#d1d1d1] p-4 rounded">
                    <div className="text-[9px] text-[#666] font-bold uppercase mb-1">현재 시트</div>
                    <div className="text-2xl font-black text-[#333]">{session.gameType}</div>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-[#333] mb-3">플레이어별 성과 기록</h4>
                <div className="overflow-x-auto">
                  <table className="excel-grid">
                    <thead>
                      <tr>
                        <th className="w-8"></th>
                        <th className="text-left pl-4">플레이어_성함</th>
                        <th className="w-24 text-center">승리_횟수</th>
                        <th className="w-24 text-center">누적_점수</th>
                        <th className="text-left pl-4">성과_그래프</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(Object.values(session.players) as Player[]).map((p, idx) => {
                        const stats = session.stats?.[p.id] || { wins: 0, totalScore: 0 };
                        const maxWins = Math.max(...Object.values(session.stats || {}).map((s: any) => s.wins), 1);
                        return (
                          <tr key={p.id}>
                            <td className="bg-[#f8f9fa] border-r border-b border-[#d1d1d1] text-[9px] font-bold text-[#999] text-center">{idx + 1}</td>
                            <td className="excel-cell font-medium">{p.nickname}</td>
                            <td className="excel-cell text-center font-bold text-[#217346]">{stats.wins}</td>
                            <td className="excel-cell text-center">{stats.totalScore}</td>
                            <td className="excel-cell">
                              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-[#217346]" 
                                  style={{ width: `${(stats.wins / maxWins) * 100}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeSheet === 'LEADERBOARD' ? (
            <div className="bg-white border border-[#d1d1d1] rounded shadow-sm overflow-hidden">
              <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 text-[10px] font-bold text-[#666]">
                전사_명예의_전당_통합_보고서
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Leaderboard entries={globalLeaderboards?.OFFICE_2048 || []} title="직급 승진 (2048)" sessionId="GLOBAL" gameType="OFFICE_2048" />
                  <Leaderboard entries={globalLeaderboards?.MINESWEEPER || []} title="데이터 검수 (지뢰찾기)" sessionId="GLOBAL" gameType="MINESWEEPER" />
                  <Leaderboard entries={globalLeaderboards?.SUDOKU || []} title="데이터 무결성 (스도쿠)" sessionId="GLOBAL" gameType="SUDOKU" />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#d1d1d1] rounded shadow-sm overflow-hidden">
              <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 text-[10px] font-bold text-[#666]">
                시트_운영_매뉴얼_v1.0
              </div>
              <div className="p-8 space-y-10">
                <section>
                  <h3 className="text-lg font-bold text-[#217346] border-b-2 border-[#217346] pb-1 mb-4 flex items-center gap-2">
                    <Shield size={20} /> 라이어 시트 (LIAR)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-bold text-[#333]">규칙 개요</h4>
                      <p className="text-gray-600 leading-relaxed">한 명의 라이어를 제외한 모든 플레이어는 제시어를 공유합니다. 라이어는 제시어를 모른 채 대화에 참여하여 정체를 숨겨야 합니다.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-[#333]">승리 조건</h4>
                      <ul className="list-disc list-inside text-gray-600 space-y-1">
                        <li>시민: 투표를 통해 라이어를 검거</li>
                        <li>라이어: 끝까지 살아남거나 정체가 들켰을 때 제시어를 맞힘</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-red-700 border-b-2 border-red-700 pb-1 mb-4 flex items-center gap-2">
                    <Siren size={20} /> 마피아 시트 (MAFIA)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-bold text-[#333]">규칙 개요</h4>
                      <p className="text-gray-600 leading-relaxed">낮에는 토론과 투표를 통해 마피아를 처형하고, 밤에는 마피아가 시민을 제거합니다. 의사와 경찰은 각자의 능력을 사용합니다.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-[#333]">역할 안내</h4>
                      <ul className="list-disc list-inside text-gray-600 space-y-1">
                        <li>마피아: 밤마다 한 명을 제거</li>
                        <li>의사: 밤마다 한 명을 치료 (마피아 공격 방어)</li>
                        <li>경찰: 밤마다 한 명의 정체를 조사</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-blue-700 border-b-2 border-blue-700 pb-1 mb-4 flex items-center gap-2">
                    <Grid size={20} /> 오목 대전 (OMOK)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-bold text-[#333]">규칙 개요</h4>
                      <p className="text-gray-600 leading-relaxed">15x15 판 위에서 돌을 번갈아 놓아 가로, 세로, 대각선 중 하나라도 5개의 돌을 먼저 잇는 사람이 승리합니다.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-[#333]">금수 규칙 (흑돌)</h4>
                      <p className="text-gray-600">흑돌은 3-3, 4-4, 6목(장목)이 금지됩니다. 백돌은 제한이 없습니다.</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-[#217346] border-b-2 border-[#217346] pb-1 mb-4 flex items-center gap-2">
                    <Hash size={20} /> 빙고 감사 (BINGO)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-bold text-[#333]">규칙 개요</h4>
                      <p className="text-gray-600 leading-relaxed">5x5 시트에 단어를 채우고, 번갈아 가며 단어를 불러 목표한 줄 수를 먼저 완성하는 플레이어가 승리합니다.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-[#333]">팁</h4>
                      <p className="text-gray-600">중앙 칸을 선점하고, 상대방이 부르는 단어를 잘 체크하여 전략적으로 줄을 완성하세요.</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-orange-600 border-b-2 border-orange-600 pb-1 mb-4 flex items-center gap-2">
                    <Palette size={20} /> 비주얼 브리핑 (DRAW)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-bold text-[#333]">규칙 개요</h4>
                      <p className="text-gray-600 leading-relaxed">발표자는 제시어를 그림으로 설명하고, 나머지 플레이어들은 채팅을 통해 정답을 맞힙니다.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-[#333]">점수 배분</h4>
                      <ul className="list-disc list-inside text-gray-600 space-y-1">
                        <li>정답자: +10점</li>
                        <li>발표자: +5점 (정답자가 나왔을 때)</li>
                      </ul>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Sheet Tabs */}
      <footer className="bg-[#f8f9fa] border-t border-[#d1d1d1] flex items-center h-8 shrink-0 overflow-x-auto">
        <button 
          onClick={() => setActiveSheet('GAME')}
          className={`office-tab ${activeSheet === 'GAME' ? 'active' : ''}`}
        >
          메인_입력
        </button>
        <button 
          onClick={() => setActiveSheet('ROLES')}
          className={`office-tab ${activeSheet === 'ROLES' ? 'active' : ''}`}
        >
          역할_데이터
        </button>
        <button 
          onClick={() => setActiveSheet('LOGS')}
          className={`office-tab ${activeSheet === 'LOGS' ? 'active' : ''}`}
        >
          로그_시트
        </button>
        <button 
          onClick={() => setActiveSheet('STATS')}
          className={`office-tab ${activeSheet === 'STATS' ? 'active' : ''}`}
        >
          통계_보고서
        </button>
        <button 
          onClick={() => setActiveSheet('LEADERBOARD')}
          className={`office-tab ${activeSheet === 'LEADERBOARD' ? 'active' : ''}`}
        >
          명예의_전당
        </button>
        <button 
          onClick={() => setActiveSheet('HELP')}
          className={`office-tab ${activeSheet === 'HELP' ? 'active' : ''}`}
        >
          설정
        </button>
        <div className="flex-1" />
        <div className="px-4 text-[9px] text-[#999] flex items-center gap-3 whitespace-nowrap">
          <span>{
            session.status === SessionStatus.LOBBY ? '대기실' :
            session.status === SessionStatus.REVEAL ? '역할_확인' :
            session.status === SessionStatus.PLAYING ? '진행_중' :
            session.status === SessionStatus.VOTING ? '투표_중' :
            session.status === SessionStatus.NIGHT ? '밤 (행동_중)' :
            session.status === SessionStatus.SUMMARY ? '결과_보고' : session.status
          }</span>
          <div className="h-3 w-px bg-[#d1d1d1]" />
          <span>준비됨</span>
        </div>
      </footer>

      {/* Chat Component */}
      <Chat 
        session={session} 
        currentUser={currentUser} 
        nickname={session.players[currentUser?.uid]?.nickname || nickname}
        isSpectator={me && !me.isAlive && session.status !== SessionStatus.LOBBY && session.status !== SessionStatus.SUMMARY}
      />
    </div>
  );
}
