import React, { useState, useEffect } from 'react';
import { User, Award, Briefcase, TrendingUp, ShieldCheck, Code, Handshake, Palette, LineChart, Users, ChevronRight } from 'lucide-react';
import { UserProfile, Department } from '../types';
import { sessionService } from '../services/sessionService';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  uid: string;
  onUpdate?: () => void;
}

const DEPARTMENTS = [
  { id: Department.DEV, name: '개발팀', icon: <Code size={16} />, color: '#217346', bonus: '오목 수읽기 보너스' },
  { id: Department.SALES, name: '영업팀', icon: <Handshake size={16} />, color: '#0078d4', bonus: '오피스 라이프 수익 +5%' },
  { id: Department.DESIGN, name: '디자인팀', icon: <Palette size={16} />, color: '#5c2d91', bonus: '그림 퀴즈 힌트 추가' },
  { id: Department.HR, name: '인사팀', icon: <Users size={16} />, color: '#b4009e', bonus: '마피아 투표권 강화' },
  { id: Department.PLANNING, name: '기획팀', icon: <LineChart size={16} />, color: '#d83b01', bonus: '빙고 단어 선택권 우선' },
];

export const UserProfileCard: React.FC<Props> = ({ uid, onUpdate }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditingDept, setIsEditingDept] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await sessionService.getUserProfile(uid);
      setProfile(data);
      if (data) setNewName(data.nickname);
      setLoading(false);
    };
    fetchProfile();
  }, [uid]);

  const handleDepartmentChange = async (dept: Department) => {
    if (!profile) return;
    await sessionService.updateUserProfile(uid, { department: dept });
    setProfile({ ...profile, department: dept });
    setIsEditingDept(false);
    onUpdate?.();
  };

  const handleNameChange = async () => {
    if (!profile || !newName.trim()) return;
    await sessionService.updateUserProfile(uid, { nickname: newName.trim() });
    setProfile({ ...profile, nickname: newName.trim() });
    setIsEditingName(false);
    onUpdate?.();
  };

  if (loading) return <div className="animate-pulse bg-white/50 h-32 rounded-lg" />;
  if (!profile) return null;

  const currentDept = DEPARTMENTS.find(d => d.id === profile.department) || DEPARTMENTS[0];
  const progress = (profile.xp % 1000) / 10;
  const isAnonymous = profile.nickname === '익명 사원';

  return (
    <div className="bg-white border border-[#d1d1d1] rounded-lg shadow-sm overflow-hidden flex flex-col relative">
      {isAnonymous && !isEditingName && (
        <div className="absolute inset-0 bg-black/40 z-20 flex flex-col items-center justify-center p-4 text-center backdrop-blur-[1px]">
          <ShieldCheck size={32} className="text-white mb-2 animate-bounce" />
          <p className="text-white text-xs font-bold mb-3">정식 사원증이 발급되지 않았습니다.</p>
          <button 
            onClick={() => setIsEditingName(true)}
            className="office-btn-primary px-4 py-2 text-xs"
          >
            사원증 발급 (이름 등록)
          </button>
        </div>
      )}

      <div className="bg-[#217346] p-3 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} />
          <span className="text-xs font-bold uppercase tracking-wider">사원증 (ID CARD)</span>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={() => setIsEditingName(!isEditingName)}
            className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
          >
            정보 수정
          </button>
          <button 
            onClick={() => setIsEditingDept(!isEditingDept)}
            className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
          >
            부서 이동
          </button>
        </div>
      </div>

      <div className="p-4 flex gap-4">
        <div className="w-20 h-24 bg-gray-100 border-2 border-gray-200 rounded flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
          <User size={40} className="text-gray-400 mb-1" />
          <div className="absolute bottom-0 w-full bg-[#217346]/80 text-white text-[8px] py-1 text-center font-bold">
            LV.{profile.level}
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <div>
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <div className="flex gap-1">
                  <input 
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="office-input text-xs py-0.5 w-24"
                    autoFocus
                  />
                  <button onClick={handleNameChange} className="text-[#217346]"><ShieldCheck size={16} /></button>
                </div>
              ) : (
                <h3 className="font-black text-lg text-gray-800 truncate max-w-[120px]">{profile.nickname}</h3>
              )}
              <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[9px] font-bold rounded border border-yellow-200 flex items-center gap-1 shrink-0">
                <Award size={10} />
                {profile.totalWins}승
              </span>
            </div>
            <div className="flex items-center gap-1 text-[#217346] font-bold text-xs">
              {currentDept.icon}
              <span>{currentDept.name}</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase">
              <span>Career Progress</span>
              <span>{profile.xp % 1000} / 1000 XP</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-[#217346]"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-2 rounded border border-gray-100">
            <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Department Bonus</p>
            <p className="text-[10px] text-[#217346] font-medium">{currentDept.bonus}</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isEditingDept && (
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-[#d1d1d1] bg-[#f8f9fa]"
          >
            <div className="p-3 space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">희망 부서를 선택하세요</p>
              <div className="grid grid-cols-1 gap-1">
                {DEPARTMENTS.map(dept => (
                  <button
                    key={dept.id}
                    onClick={() => handleDepartmentChange(dept.id)}
                    className={`flex items-center justify-between p-2 rounded border transition-all ${
                      profile.department === dept.id 
                        ? 'bg-white border-[#217346] shadow-sm' 
                        : 'bg-transparent border-transparent hover:bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-full text-white" style={{ backgroundColor: dept.color }}>
                        {dept.icon}
                      </div>
                      <div className="text-left">
                        <p className="text-[11px] font-bold text-gray-800">{dept.name}</p>
                        <p className="text-[9px] text-gray-500">{dept.bonus}</p>
                      </div>
                    </div>
                    {profile.department === dept.id && <ShieldCheck size={14} className="text-[#217346]" />}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
