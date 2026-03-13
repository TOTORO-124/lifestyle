import React, { useState, useEffect } from 'react';
import { Session, Player, OfficeLifeGameState } from '../types';
import { OFFICE_LIFE_BOARD, BoardCell } from '../data/officeLifeBoard';
import { OFFICE_ITEMS } from '../data/officeItems';
import { OFFICE_RANKS, OFFICE_ROLES } from '../data/officeRanks';
import { sessionService } from '../services/sessionService';
import { User, CreditCard, BarChart3, Play, CheckCircle2, AlertCircle, Users, Briefcase, TrendingUp, Coffee, RotateCcw, Search, ShieldCheck, ShoppingBag, Code, Handshake, Palette, LineChart, Award, ScrollText, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  session: Session;
  currentUser: any;
}

export const OfficeLifeBoard: React.FC<Props> = ({ session, currentUser }) => {
  const [isRolling, setIsRolling] = useState(false);
  const [rollingDiceNum, setRollingDiceNum] = useState(1);
  const [selectedCellIdx, setSelectedCellIdx] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string, type: string } | null>(null);
  const [lastToastTime, setLastToastTime] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'board' | 'dashboard'>('board');

  const game = session.officeLifeGame;
  
  // Toast effect based on logs
  useEffect(() => {
    if (session.logs) {
      const logsArray = Object.values(session.logs).sort((a: any, b: any) => b.timestamp - a.timestamp);
      if (logsArray.length > 0) {
        const latestLog = logsArray[0] as any;
        
        // Prevent duplicate toasts for the same log
        if (latestLog.timestamp > lastToastTime) {
          setLastToastTime(latestLog.timestamp);
          
          // Only show toast for important events (success, warning, error)
          const isImportant = latestLog.content.includes('승진') || 
                              latestLog.content.includes('감사팀') || 
                              latestLog.content.includes('파산') || 
                              latestLog.content.includes('찬스') ||
                              latestLog.content.includes('승인');
          
          if (isImportant) {
            setToast({ message: latestLog.content, type: latestLog.content.includes('감사팀') || latestLog.content.includes('파산') ? 'error' : 'success' });
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
          }
        }
      }
    }
  }, [session.logs, lastToastTime]);

  if (!game) return null;

  const me = session.players?.[currentUser.uid];
  const myState = game.playerStates?.[currentUser.uid];
  const myRole = OFFICE_ROLES.find(r => r.id === myState?.roleId);
  const myRank = OFFICE_RANKS[myState?.rankIndex || 0] || OFFICE_RANKS[0];
  const isMyTurn = game.turnOrder?.[game.currentTurnIndex] === currentUser.uid;
  const isHost = session.hostId === currentUser?.uid;

  const getRoleIcon = (roleId?: string) => {
    switch (roleId) {
      case 'DEV': return <Code size={16} />;
      case 'SALES': return <Handshake size={16} />;
      case 'DESIGN': return <Palette size={16} />;
      case 'HR': return <Users size={16} />;
      case 'PLANNER': return <LineChart size={16} />;
      default: return <User size={16} />;
    }
  };

  const getCellCoords = (index: number) => {
    if (index >= 0 && index <= 10) return { r: 10, c: 10 - index };
    if (index > 10 && index <= 20) return { r: 10 - (index - 10), c: 0 };
    if (index > 20 && index <= 30) return { r: 0, c: index - 20 };
    if (index > 30 && index < 40) return { r: index - 30, c: 10 };
    return { r: 0, c: 0 };
  };

  const getTeamColor = (teamId?: string) => {
    if (teamId === 'TEAM_A') return '#3b82f6'; // blue-500
    if (teamId === 'TEAM_B') return '#ef4444'; // red-500
    return '#217346'; // default green
  };

  const chartData = Object.entries(game.playerStates || {}).map(([id, state]) => ({
    name: session.players?.[id]?.nickname || 'Unknown',
    assets: (state as any).assets,
    color: (state as any).teamId !== 'INDIVIDUAL' ? getTeamColor((state as any).teamId) : (id === currentUser.uid ? '#217346' : '#666')
  }));

  const handleRollDice = () => {
    if (isMyTurn && !isRolling) {
      setIsRolling(true);
      // Fake rolling animation
      let rollCount = 0;
      const rollInterval = setInterval(() => {
        setRollingDiceNum(Math.floor(Math.random() * 11) + 2); // 2~12
        rollCount++;
        if (rollCount > 10) {
          clearInterval(rollInterval);
          setIsRolling(false);
          sessionService.rollOfficeLifeDice(session.id, currentUser.uid, session);
        }
      }, 100);
    }
  };

  const handleBuyProject = () => {
    sessionService.buyOfficeLifeProject(session.id, currentUser.uid, session);
  };

  const handleDrawChance = () => {
    sessionService.drawOfficeLifeChanceCard(session.id, currentUser.uid, session);
  };

  const handleBuyItem = (itemId: string) => {
    sessionService.buyOfficeLifeItem(session.id, currentUser.uid, itemId, session);
  };

  const handleUseItem = (itemId: string) => {
    sessionService.useOfficeLifeItem(session.id, currentUser.uid, itemId, session);
  };

  const handleSelectRole = (roleId: string) => {
    sessionService.selectOfficeLifeRole(session.id, currentUser.uid, roleId, session);
  };

  const handlePromotionTest = (accept: boolean) => {
    sessionService.takeOfficeLifePromotionTest(session.id, currentUser.uid, accept, session);
  };

  const handlePayFine = () => {
    sessionService.payOfficeLifeJailFine(session.id, currentUser.uid, session);
  };

  const handleEndTurn = () => {
    sessionService.endOfficeLifeTurn(session.id, currentUser.uid, session);
  };

  // AI Logic removed

  return (
    <div className="flex flex-col lg:flex-row h-full bg-[#f3f2f1] font-sans text-[#323130] overflow-hidden relative">
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex border-b border-[#d1d1d1] bg-white z-[60] flex-shrink-0">
        <button 
          onClick={() => setActiveTab('board')}
          className={`flex-1 py-2 text-xs font-bold transition-colors ${activeTab === 'board' ? 'bg-[#217346] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          게임판 보기
        </button>
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 py-2 text-xs font-bold transition-colors ${activeTab === 'dashboard' ? 'bg-[#217346] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          대시보드 & 현황
        </button>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-10 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 rounded-full shadow-2xl font-bold text-sm md:text-base flex items-center gap-2 border-2
              ${toast.type === 'error' ? 'bg-red-100 text-red-800 border-red-500' : 'bg-green-100 text-green-800 border-green-500'}
            `}
          >
            {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cell Detail Popup */}
      <AnimatePresence>
        {selectedCellIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[250] flex items-center justify-center p-4"
            onClick={() => setSelectedCellIdx(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 relative"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedCellIdx(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
              
              {(() => {
                const cell = OFFICE_LIFE_BOARD[selectedCellIdx];
                const cellData = game.cells?.[selectedCellIdx];
                const owner = cellData?.ownerId ? session.players?.[cellData.ownerId] : null;
                const ownerState = cellData?.ownerId ? game.playerStates?.[cellData.ownerId] : null;
                const ownerColor = ownerState?.teamId !== 'INDIVIDUAL' ? getTeamColor(ownerState?.teamId) : '#217346';
                
                return (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl
                        ${cell.type === 'START' ? 'bg-blue-100' : ''}
                        ${cell.type === 'JAIL' ? 'bg-red-100' : ''}
                        ${cell.type === 'REST' ? 'bg-yellow-100' : ''}
                        ${cell.type === 'TAX' ? 'bg-orange-100' : ''}
                        ${cell.type === 'CHANCE' ? 'bg-purple-100' : ''}
                        ${cell.type === 'PROJECT' ? 'bg-gray-100' : ''}
                      `}>
                        {cell.type === 'START' && '🏢'}
                        {cell.type === 'JAIL' && '🚨'}
                        {cell.type === 'REST' && '☕'}
                        {cell.type === 'TAX' && '💸'}
                        {cell.type === 'CHANCE' && '💳'}
                        {cell.type === 'PROJECT' && '📁'}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-gray-800">{cell.name}</h3>
                        <p className="text-xs text-gray-500 font-bold">{cell.type} 칸</p>
                      </div>
                    </div>

                    {cell.type === 'PROJECT' && (
                      <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-gray-600">소유자</span>
                          {owner ? (
                            <span className="text-sm font-black px-2 py-1 rounded text-white" style={{ backgroundColor: ownerColor }}>
                              {owner.nickname}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400 italic">없음</span>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-gray-600">프로젝트 레벨</span>
                          <div className="flex gap-1">
                            {[1, 2, 3].map(level => (
                              <div key={level} className={`w-4 h-4 rounded-sm border ${
                                (cellData?.level || 0) >= level 
                                  ? 'bg-yellow-400 border-yellow-600' 
                                  : 'bg-gray-200 border-gray-300'
                              }`} />
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-500">기본 협업 비용 (통행료)</span>
                            <span className="text-sm font-bold text-gray-800">{cell.rent?.[(cellData?.level || 1) - 1] || 0}만원</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">다음 레벨 승인 비용</span>
                            <span className="text-sm font-bold text-blue-600">
                              {cellData?.level === 3 ? '최대 레벨' : `${cell.price || 0}만원`}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {cell.type === 'TAX' && (
                      <p className="text-sm text-gray-600 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        도착 시 보유 자산의 10%를 세금으로 납부합니다.
                      </p>
                    )}
                    
                    {cell.type === 'JAIL' && (
                      <p className="text-sm text-gray-600 p-3 bg-red-50 rounded-lg border border-red-200">
                        도착 시 3턴 동안 경위서를 작성해야 합니다. (벌금 50만원으로 즉시 탈출 가능)
                      </p>
                    )}
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Winner Overlay */}
      {game.status === 'FINISHED' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-10 text-center animate-in zoom-in duration-500">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Award size={48} className="text-yellow-600 md:w-16 md:h-16" />
            </div>
            <h2 className="text-2xl md:text-4xl font-black text-[#217346] italic mb-1 md:mb-2">VICTORY!</h2>
            <p className="text-gray-500 font-bold uppercase text-[10px] md:text-xs tracking-widest mb-4 md:mb-8">최종 승진에 성공했습니다</p>
            
            <div className="bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-100 mb-6 md:mb-8">
              <div className="w-16 h-16 bg-[#217346] rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-xl">
                {getRoleIcon(game.playerStates?.[game.winner!]?.roleId)}
              </div>
              <p className="text-2xl font-black text-gray-800 mb-1">
                {session.players?.[game.winner!]?.nickname}
              </p>
              <p className="text-sm font-bold text-[#217346]">
                {game.playerStates?.[game.winner!]?.rank} • {game.winnerTeam ? `${game.winnerTeam === 'TEAM_A' ? 'A팀' : 'B팀'} 승리` : '개인전 승리'}
              </p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full office-btn py-4 text-sm font-bold shadow-lg"
            >
              메인으로 돌아가기
            </button>
          </div>
        </div>
      )}

      {/* Role Selection Overlay */}
      {game.waitingForAction === 'SELECT_ROLE' && !myState?.roleId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-4 md:p-8 animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="text-center mb-4 md:mb-8 flex-shrink-0">
              <h2 className="text-2xl md:text-3xl font-black text-[#217346] italic mb-1 md:mb-2">CHOOSE YOUR ROLE</h2>
              <p className="text-gray-500 font-bold uppercase text-[10px] md:text-xs tracking-widest">직무를 선택하여 고유 스킬을 획득하세요</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 overflow-y-auto pr-2 custom-scrollbar">
              {OFFICE_ROLES.map(role => (
                <button
                  key={role.id}
                  onClick={() => handleSelectRole(role.id)}
                  className="flex flex-col items-center p-3 md:p-4 border-2 border-gray-100 rounded-xl hover:border-[#217346] hover:bg-green-50 transition-all group text-center"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2 md:mb-4 group-hover:bg-[#217346] group-hover:text-white transition-colors">
                    {getRoleIcon(role.id)}
                  </div>
                  <h3 className="font-black text-sm md:text-base text-gray-800 mb-1">{role.name}</h3>
                  <p className="text-[9px] md:text-[10px] text-gray-400 mb-2 md:mb-3 leading-tight">{role.description}</p>
                  <div className="bg-white border border-gray-200 rounded-lg p-2 w-full mt-auto">
                    <p className="text-[8px] md:text-[9px] font-bold text-[#217346] leading-tight">{role.skill}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Board Area */}
      <div className={`flex-1 p-1 md:p-8 overflow-auto flex relative min-h-0 bg-[#f3f2f1] ${activeTab !== 'board' ? 'hidden lg:flex' : 'flex'}`} style={{ justifyContent: 'safe center', alignItems: 'safe center' }}>
        <div className="grid gap-0.5 md:gap-1 bg-[#d1d1d1] border-2 md:border-4 border-[#217346] shadow-2xl flex-shrink-0 rounded-lg md:rounded-xl p-0.5 md:p-1" 
          style={{ 
            width: 'min(95vw, 75vh)', 
            height: 'min(95vw, 75vh)', 
            minWidth: '280px', 
            minHeight: '280px', 
            gridTemplateColumns: 'repeat(11, minmax(0, 1fr))', 
            gridTemplateRows: 'repeat(11, minmax(0, 1fr))' 
          }}>
          {/* Render Cells */}
          {OFFICE_LIFE_BOARD.map((cell, idx) => {
            const coords = getCellCoords(idx);
            const playersInCell = Object.entries(game.playerStates || {}).filter(([_, s]) => (s as any).position === idx);
            const cellData = game.cells?.[idx];
            const owner = cellData?.ownerId ? session.players?.[cellData.ownerId] : null;
            const ownerState = cellData?.ownerId ? game.playerStates?.[cellData.ownerId] : null;
            const ownerColor = ownerState?.teamId !== 'INDIVIDUAL' ? getTeamColor(ownerState?.teamId) : (cellData?.ownerId === currentUser.uid ? '#217346' : '#666');

            return (
              <div
                key={idx}
                onClick={() => setSelectedCellIdx(idx)}
                className={`relative bg-white flex flex-col items-center justify-center p-1 md:p-2 border border-gray-200 transition-all rounded-sm shadow-sm overflow-hidden cursor-pointer hover:bg-gray-50
                  ${myState?.position === idx ? 'ring-4 ring-inset ring-yellow-400 z-10' : ''}
                  ${cell.type === 'START' ? 'bg-blue-100' : ''}
                  ${cell.type === 'JAIL' ? 'bg-red-100' : ''}
                  ${cell.type === 'REST' ? 'bg-yellow-100' : ''}
                  ${cell.type === 'TAX' ? 'bg-orange-50' : ''}
                  ${cell.type === 'CHANCE' ? 'bg-purple-50' : ''}
                `}
                style={{ gridRow: coords.r + 1, gridColumn: coords.c + 1 }}
              >
                <span className="absolute top-0.5 left-1 text-[8px] md:text-[10px] text-gray-400 font-mono">{idx}</span>
                
                {owner && (
                  <div className="absolute top-0 right-0 w-full h-1.5 opacity-80" style={{ backgroundColor: ownerColor }} />
                )}

                <div className="text-[7px] md:text-[12px] font-bold text-center leading-tight mb-0.5 md:mb-1 mt-1 md:mt-2 px-0.5 md:px-1 break-keep">
                  {cell.name}
                </div>

                {cell.type === 'PROJECT' && cellData && (
                  <div className="flex gap-0.5 mb-0.5 md:mb-1 flex-wrap justify-center">
                    {[...Array(cellData.level)].map((_, i) => (
                      <div key={i} className="w-1 h-1 md:w-2 md:h-2 bg-yellow-400 rounded-sm border border-yellow-600 shadow-sm" />
                    ))}
                  </div>
                )}

                {/* Players */}
                <div className="flex flex-wrap justify-center gap-0.5 md:gap-1 mt-auto pb-0.5 md:pb-1">
                  {playersInCell.map(([pid, pState]: [string, any]) => {
                    const isTeam = pState.teamId !== 'INDIVIDUAL';
                    const playerColor = isTeam ? getTeamColor(pState.teamId) : (pid === currentUser.uid ? '#217346' : '#666');
                    const nickname = session.players?.[pid]?.nickname || '';
                    const initial = nickname.charAt(0).toUpperCase();
                    
                    return (
                      <motion.div
                        layoutId={`player-${pid}`}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        key={pid}
                        className={`w-3.5 h-3.5 md:w-6 md:h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center font-black text-[8px] md:text-xs text-white
                          ${pid === currentUser.uid ? 'z-20 scale-125 ring-2 ring-yellow-400 animate-pulse' : 'z-10'}
                          ${isTeam ? 'shadow-lg' : ''}
                        `}
                        style={{ backgroundColor: playerColor }}
                        title={nickname}
                      >
                        {initial}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Center Area */}
          <div className="col-start-2 col-end-11 row-start-2 row-end-11 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-2 md:p-8 text-center rounded-lg m-0.5 md:m-1 shadow-inner border border-gray-200">
            <div className="mb-1 md:mb-4 opacity-10">
              <TrendingUp size={40} className="text-[#217346] md:w-[120px] md:h-[120px]" />
            </div>
            <h1 className="text-xl md:text-5xl font-black text-[#217346] italic tracking-tighter mb-0.5 md:mb-2">OFFICE LIFE</h1>
            <p className="text-[8px] md:text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 md:mb-8">Promotion Battle v1.0</p>
            
            <div className="flex gap-1 md:gap-4 items-center scale-75 md:scale-100">
              {(game.lastDice || isRolling) && (
                <div className="bg-white border md:border-2 border-[#217346] rounded-lg p-2 md:p-4 shadow-xl min-w-[50px] md:min-w-[80px]">
                  <div className="text-[7px] md:text-[10px] font-bold text-[#999] uppercase mb-0.5 md:mb-1">Dice Result</div>
                  <div className={`text-2xl md:text-6xl font-black text-[#217346] ${isRolling ? 'animate-bounce' : ''}`}>
                    {isRolling ? rollingDiceNum : game.lastDice}
                  </div>
                </div>
              )}

              {game.lastChanceCard && (
                <div className={`bg-white border md:border-2 rounded-lg p-2 md:p-4 shadow-xl max-w-[120px] md:max-w-xs text-left animate-in fade-in zoom-in duration-300
                  ${game.lastChanceCard.type === 'GOOD' ? 'border-green-500' : game.lastChanceCard.type === 'BAD' ? 'border-red-500' : 'border-blue-500'}
                `}>
                  <div className="text-[7px] md:text-[10px] font-bold text-[#999] uppercase mb-0.5 md:mb-1">법인카드 찬스</div>
                  <div className="text-[10px] md:text-lg font-black text-gray-800 mb-0.5 md:mb-1 truncate">{game.lastChanceCard.title}</div>
                  <div className="text-[8px] md:text-xs text-gray-600 leading-tight line-clamp-2 md:line-clamp-none">{game.lastChanceCard.message}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile FAB for Rolling Dice */}
        <AnimatePresence>
          {isMyTurn && activeTab === 'board' && (!game.waitingForAction || game.waitingForAction === 'NONE') && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={handleRollDice}
              className="lg:hidden fixed bottom-20 right-6 w-16 h-16 bg-[#217346] text-white rounded-full shadow-2xl flex items-center justify-center z-[70] border-4 border-white"
            >
              <Play size={24} fill="white" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Right Sidebar: Dashboard */}
      <div className={`w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-[#d1d1d1] flex flex-col shadow-2xl z-20 h-full lg:h-full flex-shrink-0 lg:flex-shrink ${activeTab !== 'dashboard' ? 'hidden lg:flex' : 'flex'}`}>
        <div className="bg-[#217346] text-white px-4 py-2 lg:py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">실시간 자산 현황표</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Asset Chart */}
          <div className="h-48 w-full bg-gray-50 rounded border border-[#e1e1e1] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={60} fontSize={10} stroke="#666" />
                <Tooltip cursor={{fill: 'rgba(33, 115, 70, 0.05)'}} />
                <Bar dataKey="assets" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* My Status */}
          <div className="bg-white border border-[#d1d1d1] rounded p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#217346] rounded-full flex items-center justify-center text-white shadow-inner">
                {getRoleIcon(myState?.roleId)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-black text-gray-800">{currentUser.nickname}</p>
                  <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[8px] font-bold rounded border border-yellow-200 flex items-center gap-1">
                    <Award size={8} />
                    {myRank.name}
                  </span>
                </div>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                  {myRole?.name || '직무 미선택'} • {myRole?.description}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
              <div>
                <p className="text-[8px] text-gray-400 uppercase">현재 직급</p>
                <p className="text-sm font-black text-gray-800">{myState?.rank}</p>
              </div>
              <div>
                <p className="text-[8px] text-gray-400 uppercase">보유 자산</p>
                <p className="text-sm font-black text-[#217346]">{myState?.assets.toLocaleString()}만원</p>
              </div>
            </div>
            {myRole && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="bg-green-50 border border-green-100 rounded p-2">
                  <p className="text-[9px] font-bold text-[#217346] leading-tight">
                    <span className="uppercase mr-1">[Skill]</span> {myRole.skill}
                  </p>
                </div>
              </div>
            )}
            {myState?.isJailed && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                <div className="flex items-center gap-2 text-red-600 mb-2">
                  <AlertCircle size={14} />
                  <span className="text-[10px] font-bold uppercase">감사팀 조사 중</span>
                </div>
                <p className="text-[9px] text-red-500 mb-3 leading-tight">경위서를 작성하고 있습니다. ({myState.jailTurns}/3)</p>
                <button
                  onClick={handlePayFine}
                  disabled={myState.assets < 500}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded shadow-sm disabled:opacity-50 transition-colors"
                >
                  벌금 500만원 내고 복귀
                </button>
              </div>
            )}
          </div>

          {/* My Items */}
          <div className="bg-white border border-[#d1d1d1] rounded p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-blue-600">
              <ShoppingBag size={14} />
              <span className="text-[10px] font-bold uppercase">내 인벤토리</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {myState?.items && myState.items.length > 0 ? (
                myState.items.map((itemId, idx) => {
                  const item = OFFICE_ITEMS.find(i => i.id === itemId);
                  if (!item) return null;
                  return (
                    <button
                      key={`${itemId}-${idx}`}
                      onClick={() => handleUseItem(itemId)}
                      className="p-2 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors group relative"
                      title={item.description}
                    >
                      {item.id === 'COFFEE' && <Coffee size={16} className="text-blue-600" />}
                      {item.id === 'CTRL_Z' && <RotateCcw size={16} className="text-blue-600" />}
                      {item.id === 'VLOOKUP' && <Search size={16} className="text-blue-600" />}
                      {item.id === 'SHIELD' && <ShieldCheck size={16} className="text-blue-600" />}
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50">
                        {item.name} (클릭하여 사용)
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="text-[10px] text-gray-400 italic">보유한 아이템이 없습니다.</p>
              )}
            </div>
          </div>

          {/* Turn Info */}
          <div className="bg-gray-50 border border-[#d1d1d1] rounded p-4">
            <div className="flex items-center gap-2 mb-3 text-gray-500">
              <Users size={14} />
              <span className="text-[10px] font-bold uppercase">진행 순서</span>
            </div>
            <div className="space-y-2">
              {game.turnOrder?.map((pid, idx) => {
                const pState = game.playerStates?.[pid];
                const playerColor = pState?.teamId !== 'INDIVIDUAL' ? getTeamColor(pState?.teamId) : (idx === game.currentTurnIndex ? '#217346' : '#666');
                const isCurrent = idx === game.currentTurnIndex;
                
                return (
                  <div 
                    key={pid} 
                    className={`flex items-center justify-between p-2 rounded text-[10px] transition-all`}
                    style={{ 
                      backgroundColor: isCurrent ? playerColor : 'white',
                      color: isCurrent ? 'white' : '#666',
                      borderLeft: !isCurrent ? `3px solid ${playerColor}` : 'none',
                      fontWeight: isCurrent ? 'bold' : 'normal'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="opacity-50">{idx + 1}.</span>
                      <div className="flex items-center gap-1">
                        <span>{session.players?.[pid]?.nickname}</span>
                      </div>
                    </div>
                    {isCurrent && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Game Logs */}
          <div className="bg-white border border-[#d1d1d1] rounded p-4 shadow-sm flex flex-col h-48">
            <div className="flex items-center gap-2 mb-3 text-[#217346]">
              <ScrollText size={14} />
              <span className="text-[10px] font-bold uppercase">게임 기록</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
              {session.logs && Object.keys(session.logs).length > 0 ? (
                Object.values(session.logs)
                  .sort((a: any, b: any) => b.timestamp - a.timestamp)
                  .slice(0, 50)
                  .map((log: any, idx) => (
                  <div key={idx} className="text-[10px] leading-tight border-b border-gray-50 pb-1 last:border-0 animate-in fade-in slide-in-from-top-1">
                    <span className="text-gray-400 text-[8px] mr-1">
                      {new Date(log.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className={`text-gray-700 ${log.type === 'success' ? 'text-green-600 font-bold' : log.type === 'warning' ? 'text-orange-600 font-bold' : log.type === 'error' ? 'text-red-600 font-bold' : ''}`}>
                      {log.content}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-gray-400 italic text-center py-4">
                  아직 기록이 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 bg-[#f8f9fa] border-t border-[#d1d1d1] space-y-3 flex-shrink-0">
          {isMyTurn ? (
            <>
              {(!game.waitingForAction || game.waitingForAction === 'NONE') ? (
                <button
                  onClick={handleRollDice}
                  className="w-full office-btn-primary py-4 flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-transform"
                >
                  <Play size={20} fill="white" />
                  <span className="text-sm font-black">주사위 굴리기</span>
                </button>
              ) : (
                <div className="space-y-2 max-h-[30vh] overflow-y-auto custom-scrollbar pr-1">
                  {game.waitingForAction === 'BUY_PROJECT' && (
                    <button
                      onClick={handleBuyProject}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded font-bold text-xs shadow-md transition-colors"
                    >
                      프로젝트 승인 (구매/업그레이드)
                    </button>
                  )}
                  {game.waitingForAction === 'CHANCE_CARD' && (
                    <button
                      onClick={handleDrawChance}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded font-bold text-xs shadow-md transition-colors"
                    >
                      법인카드 찬스 확인
                    </button>
                  )}
                  {game.waitingForAction === 'BUY_ITEM' && myState && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-500 uppercase text-center mb-1">탕비실 상점</p>
                      <div className="grid grid-cols-2 gap-2">
                        {OFFICE_ITEMS.map(item => (
                          <button
                            key={item.id}
                            onClick={() => handleBuyItem(item.id)}
                            disabled={(myState?.assets || 0) < item.price}
                            className="flex flex-col items-center p-2 bg-white border border-[#d1d1d1] rounded hover:border-blue-500 disabled:opacity-50 transition-all"
                          >
                            <span className="text-[9px] font-bold">{item.name}</span>
                            <span className="text-[8px] text-blue-600">{item.price}만원</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {game.waitingForAction === 'PROMOTION_TEST' && myState && (
                    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-2 md:p-4 animate-pulse">
                      <div className="text-center mb-2 md:mb-3">
                        <Award className="mx-auto text-yellow-600 mb-1" size={20} />
                        <h4 className="text-xs md:text-sm font-black text-yellow-800">승진 기회 포착!</h4>
                        <p className="text-[9px] md:text-[10px] text-yellow-700">
                          {OFFICE_RANKS[(myState.rankIndex || 0) + 1]?.name}으로 승진하시겠습니까?<br/>
                          (비용: {OFFICE_RANKS[(myState.rankIndex || 0) + 1]?.promotionCost}만원)
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handlePromotionTest(true)}
                          disabled={(myState.assets || 0) < (OFFICE_RANKS[(myState.rankIndex || 0) + 1]?.promotionCost || 0)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white py-1.5 md:py-2 rounded font-bold text-[9px] md:text-[10px] shadow-sm disabled:opacity-50"
                        >
                          승진 도전
                        </button>
                        <button
                          onClick={() => handlePromotionTest(false)}
                          className="bg-gray-400 hover:bg-gray-500 text-white py-1.5 md:py-2 rounded font-bold text-[9px] md:text-[10px] shadow-sm"
                        >
                          다음에
                        </button>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={handleEndTurn}
                    className={`w-full office-btn py-3 text-xs font-bold shadow-sm ${game.waitingForAction === 'END_TURN' || game.waitingForAction === 'BUY_ITEM' ? 'animate-pulse ring-2 ring-blue-400' : ''}`}
                  >
                    업무 종료 (턴 넘기기)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4 text-gray-400 italic text-[10px]">
              {game.turnOrder && game.currentTurnIndex !== undefined && session.players?.[game.turnOrder[game.currentTurnIndex]]?.nickname}님의 결재를 기다리는 중...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
