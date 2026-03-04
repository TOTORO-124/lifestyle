import React, { useState, useEffect } from 'react';
import { Session, Player, SessionStatus, GameType, LiarMode, MafiaRole, MafiaPhase } from './types';
import { sessionService } from './services/sessionService';
import { isConfigured } from './firebase';
import { Chat } from './components/Chat';
import { LIAR_TOPICS } from './data/topics';
import { Users, Shield, User, Play, LogOut, CheckCircle2, Circle, Settings2, AlertTriangle, FileText, Share2, HelpCircle, MoreVertical, Search, Filter, Grid, Download, Moon, Sun, Stethoscope, Siren, RefreshCw, ListOrdered, ArrowUp, ArrowDown } from 'lucide-react';

export default function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [menuMode, setMenuMode] = useState<'create' | 'join'>('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [selectedVoteTarget, setSelectedVoteTarget] = useState<string | null>(null);
  const [selectedNightTarget, setSelectedNightTarget] = useState<string | null>(null);

  useEffect(() => {
    setSelectedVoteTarget(null);
    setSelectedNightTarget(null);
  }, [session?.status]);

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
      const allVoted = alivePlayers.every(p => p.voteTarget);
      if (allVoted && alivePlayers.length > 0) {
        if (session.gameType === GameType.LIAR && session.liarGame) {
          sessionService.processLiarVote(session.id, session.players, session.liarGame);
        } else if (session.gameType === GameType.MAFIA) {
          sessionService.processMafiaVote(session.id, session.players);
        }
      }
    }
  }, [session, currentUser]);

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
    } else {
      await sessionService.startMafiaGame(session.id, session.players, session.settings, session.turnOrder);
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
            <h1 className="text-sm font-bold tracking-tight">프로젝트_감사_v2.xlsx</h1>
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
            <span className="font-mono truncate">=IF(사용자_인증, "로그인_성공", "본인_확인_대기중")</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
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
                    <p className="text-[10px] text-[#999]">새로운 감사 세션을 생성하고 팀원들을 초대합니다.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleCreateSession(GameType.LIAR)} 
                        className="office-btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1"
                        disabled={loading}
                      >
                        <span className="font-bold">라이어 게임</span>
                        <span className="text-[9px] font-normal opacity-80">거짓말쟁이 찾기</span>
                      </button>
                      <button 
                        onClick={() => handleCreateSession(GameType.MAFIA)} 
                        className="office-btn py-3 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1"
                        disabled={loading}
                      >
                        <span className="font-bold">마피아 게임</span>
                        <span className="text-[9px] font-normal opacity-80">범인 색출 작전</span>
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
        </div>

        {/* Sheet Tabs */}
        <footer className="bg-[#f8f9fa] border-t border-[#d1d1d1] flex items-center h-8 shrink-0">
          <div className="office-tab active">메인_입력</div>
          <div className="office-tab">로그_시트</div>
          <div className="office-tab">설정</div>
          <div className="flex-1" />
          <div className="px-4 text-[10px] text-[#999]">100% 준비됨</div>
        </footer>
      </div>
    );
  }

  if (!session) return <div className="flex items-center justify-center h-screen spreadsheet-bg font-mono text-[10px] text-[#666]">#리소스_로드_중...</div>;

  const isHost = session.hostId === currentUser?.uid;
  const me = session.players[currentUser?.uid];

  return (
    <div className="min-h-screen spreadsheet-bg flex flex-col font-sans">
      {/* Header */}
      <header className="bg-[#217346] text-white px-4 py-1.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-sm">
            <Grid className="text-[#217346]" size={16} />
          </div>
          <h1 className="text-sm font-bold tracking-tight truncate max-w-[200px] sm:max-w-none">
            {session.gameType === GameType.LIAR ? '감사_라이어_게임.xlsx' : '감사_마피아_게임.xlsx'}
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

      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-5xl mx-auto space-y-6">
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
                            <label className="text-[9px] font-bold text-[#999]">게임_모드</label>
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
                        session.liarGame?.mode === LiarMode.FOOL ? '시민' : (
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

          {session.status === SessionStatus.PLAYING && (
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

                  <div className="pt-4 border-t border-[#d1d1d1] flex justify-center">
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
                                게임_계속하기 (다음 라운드)
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
                              <span className="font-bold">{session.players[session.mafiaGame.eliminatedPlayerId]?.nickname}</span>님이 게임에서 제외되었습니다.
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
                      <p className="text-xs mt-2">게임 진행을 지켜봐주세요.</p>
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
                      {session.gameType === GameType.LIAR ? (
                        <div className="space-y-3">
                          {session.liarGame?.winner === 'LIAR' ? (
                            <>
                              <div className="text-xs text-[#666]">승리:</div>
                              <div className="text-4xl font-black text-red-600">라이어 승리!</div>
                              <div className="text-sm text-[#666]">
                                라이어는 <span className="font-bold text-[#333]">{session.players[session.liarGame!.liarPlayerId].nickname}</span> 였습니다.
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-xs text-[#666]">식별된 라이어:</div>
                              <div className="text-3xl font-black text-[#217346]">
                                {session.players[session.liarGame!.liarPlayerId].nickname}
                              </div>
                              <div className="text-[10px] text-[#666] bg-[#f8f9fa] p-2 inline-block rounded">
                                정답 데이터: <span className="font-bold text-[#333]">{session.liarGame?.commonWord}</span>
                              </div>
                            </>
                          )}
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
                                p.role === 'MAFIA' || p.id === session.liarGame?.liarPlayerId ? 'text-red-600' : 
                                p.role === 'DOCTOR' ? 'text-green-600' :
                                p.role === 'POLICE' ? 'text-blue-600' : 'text-[#217346]'
                              }`}>
                                {session.gameType === GameType.MAFIA ? (
                                  p.role === 'MAFIA' ? '마피아' :
                                  p.role === 'DOCTOR' ? '의사' :
                                  p.role === 'POLICE' ? '경찰' : '시민'
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
        </div>
      </main>

      {/* Sheet Tabs */}
      <footer className="bg-[#f8f9fa] border-t border-[#d1d1d1] flex items-center h-8 shrink-0 overflow-x-auto">
        <div className="office-tab active">감사_시트</div>
        <div className="office-tab">역할_데이터</div>
        <div className="office-tab">로그_시트</div>
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
