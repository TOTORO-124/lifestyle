import React from 'react';
import { Session, Player, OfficeLifeGameState } from '../types';
import { OFFICE_LIFE_BOARD, BoardCell } from '../data/officeLifeBoard';
import { OFFICE_ITEMS } from '../data/officeItems';
import { OFFICE_RANKS, OFFICE_ROLES } from '../data/officeRanks';
import { sessionService } from '../services/sessionService';
import { User, CreditCard, BarChart3, Play, CheckCircle2, AlertCircle, Users, Briefcase, TrendingUp, Coffee, RotateCcw, Search, ShieldCheck, ShoppingBag, Code, Handshake, Palette, LineChart, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  session: Session;
  currentUser: any;
}

export const OfficeLifeBoard: React.FC<Props> = ({ session, currentUser }) => {
  const game = session.officeLifeGame;
  if (!game) return null;

  const me = session.players?.[currentUser.uid];
  const myState = game.playerStates?.[currentUser.uid];
  const myRole = OFFICE_ROLES.find(r => r.id === myState?.roleId);
  const myRank = OFFICE_RANKS[myState?.rankIndex || 0] || OFFICE_RANKS[0];
  const isMyTurn = game.turnOrder?.[game.currentTurnIndex] === currentUser.uid;

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

  const chartData = Object.entries(game.playerStates || {}).map(([id, state]) => ({
    name: session.players?.[id]?.nickname || 'Unknown',
    assets: (state as any).assets,
    color: id === currentUser.uid ? '#217346' : '#666'
  }));

  const handleRollDice = () => {
    if (isMyTurn) {
      sessionService.rollOfficeLifeDice(session.id, currentUser.uid, session);
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

  return (
    <div className="flex flex-col lg:flex-row h-full bg-[#f3f2f1] font-sans text-[#323130] overflow-hidden relative">
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
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-4 md:p-8 animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="text-center mb-4 md:mb-8 flex-shrink-0">
              <h2 className="text-2xl md:text-3xl font-black text-[#217346] italic mb-1 md:mb-2">CHOOSE YOUR ROLE</h2>
              <p className="text-gray-500 font-bold uppercase text-[10px] md:text-xs tracking-widest">직무를 선택하여 고유 스킬을 획득하세요</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 overflow-y-auto pr-2 custom-scrollbar">
              {OFFICE_ROLES.map(role => (
                <button
                  key={role.id}
                  onClick={() => handleSelectRole(role.id)}
                  className="flex flex-col items-center p-4 md:p-6 border-2 border-gray-100 rounded-xl hover:border-[#217346] hover:bg-green-50 transition-all group text-center"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2 md:mb-4 group-hover:bg-[#217346] group-hover:text-white transition-colors">
                    {getRoleIcon(role.id)}
                  </div>
                  <h3 className="font-black text-sm md:text-base text-gray-800 mb-1">{role.name}</h3>
                  <p className="text-[9px] md:text-[10px] text-gray-400 mb-2 md:mb-3">{role.description}</p>
                  <div className="bg-white border border-gray-200 rounded-lg p-2 w-full">
                    <p className="text-[8px] md:text-[9px] font-bold text-[#217346] leading-tight">{role.skill}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Main Board Area */}
      <div className="flex-1 p-2 md:p-4 overflow-auto flex items-center justify-center relative min-h-0">
        <div className="grid grid-cols-11 grid-rows-11 gap-px bg-[#d1d1d1] border-2 border-[#217346] shadow-2xl flex-shrink-0" style={{ width: 'min(85vh, 95vw)', height: 'min(85vh, 95vw)' }}>
          {/* Render Cells */}
          {OFFICE_LIFE_BOARD.map((cell, idx) => {
            const coords = getCellCoords(idx);
            const playersInCell = Object.entries(game.playerStates || {}).filter(([_, s]) => (s as any).position === idx);
            const cellData = game.cells?.[idx];
            const owner = cellData?.ownerId ? session.players?.[cellData.ownerId] : null;

            return (
              <div
                key={idx}
                className={`relative bg-white flex flex-col items-center justify-center p-1 border border-transparent transition-all
                  ${myState?.position === idx ? 'ring-2 ring-inset ring-[#217346] bg-green-50' : ''}
                  ${cell.type === 'START' ? 'bg-blue-50' : ''}
                  ${cell.type === 'JAIL' ? 'bg-red-50' : ''}
                  ${cell.type === 'REST' ? 'bg-yellow-50' : ''}
                `}
                style={{ gridRow: coords.r + 1, gridColumn: coords.c + 1 }}
              >
                <span className="absolute top-0.5 left-0.5 text-[8px] text-gray-400">{idx}</span>
                
                {owner && (
                  <div className="absolute top-0 right-0 w-full h-1" style={{ backgroundColor: cellData.ownerId === currentUser.uid ? '#217346' : '#666' }} />
                )}

                <div className="text-[8px] md:text-[10px] font-bold text-center leading-tight mb-1">
                  {cell.name}
                </div>

                {cell.type === 'PROJECT' && cellData && (
                  <div className="flex gap-0.5 mb-1">
                    {[...Array(cellData.level)].map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 bg-yellow-400 rounded-full border border-yellow-600" />
                    ))}
                  </div>
                )}

                {/* Players */}
                <div className="flex flex-wrap justify-center gap-0.5">
                  {playersInCell.map(([pid, _]) => (
                    <div
                      key={pid}
                      className={`w-3 h-3 md:w-4 md:h-4 rounded-full border border-white shadow-sm flex items-center justify-center
                        ${pid === currentUser.uid ? 'bg-[#217346] z-10 scale-110' : 'bg-gray-500'}
                      `}
                      title={session.players?.[pid]?.nickname}
                    >
                      {pid === currentUser.uid && <User size={10} className="text-white" />}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Center Area */}
          <div className="col-start-2 col-end-11 row-start-2 row-end-11 bg-white/50 flex flex-col items-center justify-center p-2 md:p-8 text-center">
            <div className="mb-2 md:mb-4 opacity-10">
              <TrendingUp size={60} className="text-[#217346] md:w-[120px] md:h-[120px]" />
            </div>
            <h1 className="text-xl md:text-4xl font-black text-[#217346] italic tracking-tighter mb-1 md:mb-2">OFFICE LIFE</h1>
            <p className="text-[8px] md:text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 md:mb-8">Promotion Battle v1.0</p>
            
            <div className="flex gap-2 md:gap-4 items-center scale-75 md:scale-100">
              {game.lastDice && (
                <div className="bg-white border-2 border-[#217346] rounded-lg p-4 shadow-xl animate-bounce">
                  <div className="text-[10px] font-bold text-[#999] uppercase mb-1">Dice Result</div>
                  <div className="text-5xl font-black text-[#217346]">{game.lastDice}</div>
                </div>
              )}

              {game.lastChanceCard && (
                <div className={`bg-white border-2 rounded-lg p-4 shadow-xl max-w-xs text-left animate-in fade-in zoom-in duration-300
                  ${game.lastChanceCard.type === 'GOOD' ? 'border-green-500' : game.lastChanceCard.type === 'BAD' ? 'border-red-500' : 'border-blue-500'}
                `}>
                  <div className="text-[8px] font-bold text-[#999] uppercase mb-1">법인카드 찬스</div>
                  <div className="text-lg font-black text-gray-800 mb-1">{game.lastChanceCard.title}</div>
                  <div className="text-xs text-gray-600 leading-tight">{game.lastChanceCard.message}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar: Dashboard */}
      <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-[#d1d1d1] flex flex-col shadow-2xl z-20 h-[40vh] lg:h-full flex-shrink-0 lg:flex-shrink">
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
              {game.turnOrder?.map((pid, idx) => (
                <div key={pid} className={`flex items-center justify-between p-2 rounded text-[10px] ${idx === game.currentTurnIndex ? 'bg-[#217346] text-white font-bold' : 'bg-white text-gray-600'}`}>
                  <div className="flex items-center gap-2">
                    <span className="opacity-50">{idx + 1}.</span>
                    <span>{session.players?.[pid]?.nickname}</span>
                  </div>
                  {idx === game.currentTurnIndex && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 bg-[#f8f9fa] border-t border-[#d1d1d1] space-y-3">
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
                <div className="space-y-2">
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
                          {OFFICE_RANKS[myState.rankIndex + 1]?.name}으로 승진하시겠습니까?<br/>
                          (비용: {OFFICE_RANKS[myState.rankIndex + 1]?.promotionCost}만원)
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handlePromotionTest(true)}
                          disabled={myState.assets < (OFFICE_RANKS[myState.rankIndex + 1]?.promotionCost || 0)}
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
                    className="w-full office-btn py-3 text-xs font-bold shadow-sm"
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
