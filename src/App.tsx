import React, { useState, useEffect } from 'react';
import { Session, Player, SessionStatus, GameType, LiarMode } from './types';
import { sessionService } from './services/sessionService';
import { isConfigured } from './firebase';
import { LIAR_TOPICS } from './data/topics';
import { Users, Shield, User, Play, LogOut, CheckCircle2, Circle, Settings2, AlertTriangle, FileText, Share2, HelpCircle, MoreVertical, Search, Filter, Grid, Download } from 'lucide-react';

export default function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [selectedVoteTarget, setSelectedVoteTarget] = useState<string | null>(null);

  useEffect(() => {
    setSelectedVoteTarget(null);
  }, [session?.status]);

  // Synchronized Transitions
  useEffect(() => {
    if (!session || !session.players) return;
    
    // Only host triggers transitions
    if (session.hostId !== currentUser?.uid) return;

    const players = Object.values(session.players) as Player[];
    
    // Reveal -> Playing
    if (session.status === SessionStatus.REVEAL) {
      const allConfirmed = players.every(p => p.hasConfirmedRole);
      if (allConfirmed && players.length > 0) {
        sessionService.advanceStatus(session.id, SessionStatus.PLAYING);
      }
    }

    // Voting -> Vote Result (Liar) or Summary (Mafia)
    if (session.status === SessionStatus.VOTING) {
      const alivePlayers = players.filter(p => p.isAlive);
      const allVoted = alivePlayers.every(p => p.voteTarget);
      if (allVoted && alivePlayers.length > 0) {
        if (session.gameType === GameType.LIAR) {
          sessionService.processLiarVote(session.id, session.players);
        } else {
          sessionService.advanceStatus(session.id, SessionStatus.SUMMARY);
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
        setSession(data);
        if (!data) {
          setSessionId(null);
          setError('세션이 종료되었거나 찾을 수 없습니다.');
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
      await sessionService.startLiarGame(session.id, session.players, session.settings);
    } else {
      await sessionService.startMafiaGame(session.id, session.players);
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
                        if (joinCode) handleJoinSession();
                        else handleCreateSession(GameType.LIAR);
                      }
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleCreateSession(GameType.LIAR)} 
                    className="office-btn-primary py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? '생성 중...' : '새_세션 (라이어)'}
                  </button>
                  <button 
                    onClick={() => handleCreateSession(GameType.MAFIA)} 
                    className="office-btn py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? '생성 중...' : '새_세션 (마피아)'}
                  </button>
                </div>

                <div className="pt-4 border-t border-[#d1d1d1] space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="office-input flex-1"
                      placeholder="세션_코드"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleJoinSession()}
                    />
                    <button 
                      onClick={handleJoinSession} 
                      className="office-btn px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading}
                    >
                      {loading ? '참여 중...' : '참여'}
                    </button>
                  </div>
                </div>
              </div>
              {error && <p className="text-[10px] text-red-600 font-mono">#오류: {error}</p>}
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
                      </tr>
                    </thead>
                    <tbody>
                      {(Object.values(session.players) as Player[]).map((player, idx) => (
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
                        me?.role === 'MAFIA' ? '마피아' : '시민'
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
              <div className="bg-white border border-[#d1d1d1] p-4 rounded shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <div>
                    <h3 className="text-[10px] font-bold text-[#666]">세션_활성화됨</h3>
                    <p className="text-sm font-bold">토론이 진행 중입니다...</p>
                  </div>
                </div>
                {isHost && (
                  <button 
                    onClick={() => sessionService.advanceStatus(session.id, SessionStatus.VOTING)}
                    className="office-btn-primary w-full sm:w-auto"
                  >
                    투표_단계로_전환
                  </button>
                )}
              </div>

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
                  {session.liarGame?.lastVotedPlayerId ? (
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
                          <div className="text-xs text-[#666]">식별된 라이어:</div>
                          <div className="text-3xl font-black text-[#217346]">
                            {session.players[session.liarGame!.liarPlayerId].nickname}
                          </div>
                          <div className="text-[10px] text-[#666] bg-[#f8f9fa] p-2 inline-block rounded">
                            정답 데이터: <span className="font-bold text-[#333]">{session.liarGame?.commonWord}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-xs text-[#666]">식별된 마피아:</div>
                          <div className="text-3xl font-black text-red-600">
                            {(Object.values(session.players) as Player[]).filter(p => p.role === 'MAFIA').map(p => p.nickname).join(', ')}
                          </div>
                          {session.mafiaGame?.winner && (
                            <div className="mt-4 p-2 bg-[#f1f8f5] text-[#217346] text-xs font-bold border border-[#217346] rounded">
                              {session.mafiaGame.winner === 'MAFIA' ? '마피아_승리' : '시민_승리'}
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
                              <td className="excel-cell text-xs font-bold text-[#217346] text-center">
                                {p.role === 'MAFIA' ? '마피아' : (p.id === session.liarGame?.liarPlayerId ? '라이어' : '시민')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {isHost && (
                    <button 
                      onClick={() => sessionService.advanceStatus(session.id, SessionStatus.LOBBY)}
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
            session.status === SessionStatus.SUMMARY ? '결과_보고' : session.status
          }</span>
          <div className="h-3 w-px bg-[#d1d1d1]" />
          <span>준비됨</span>
        </div>
      </footer>
    </div>
  );
}
