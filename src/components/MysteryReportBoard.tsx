import React, { useState, useEffect, useRef } from 'react';
import { Session, Player, MysteryReportGameState } from '../types';
import { sessionService } from '../services/sessionService';
import { mysteryService } from '../services/mysteryService';
import { 
  FileText, 
  HelpCircle, 
  Send, 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  Lightbulb,
  Search,
  MessageSquare,
  Trophy,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MysteryReportBoardProps {
  session: Session;
  currentUser: any;
}

export const MysteryReportBoard: React.FC<MysteryReportBoardProps> = ({ session, currentUser }) => {
  const [question, setQuestion] = useState('');
  const [guess, setGuess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingGuess, setIsCheckingGuess] = useState(false);
  const game = session.mysteryReportGame as MysteryReportGameState;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [game?.questions]);

  // Handle AI response for new questions
  useEffect(() => {
    if (!game || game.status !== 'PLAYING') return;

    const unanswered = Object.values(game.questions || {}).find(q => !q.answer);
    if (unanswered && unanswered.playerId === currentUser.uid) {
      // The person who asked the question triggers the AI response
      const processAI = async () => {
        const history = Object.values(game.questions || {}).filter(q => q.answer);
        const result = await mysteryService.answerQuestion(game.mystery, game.solution, unanswered.text, history);
        await sessionService.answerMysteryQuestion(session.id, unanswered.id, result.answer, result.text);
      };
      processAI();
    }
  }, [game?.questions, currentUser.uid, session.id]);

  const handleSubmitQuestion = async (customText?: string) => {
    const textToSubmit = typeof customText === 'string' ? customText : question;
    if (!textToSubmit.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await sessionService.submitMysteryQuestion(
        session.id, 
        currentUser.uid, 
        session.players[currentUser.uid]?.nickname || '익명', 
        textToSubmit.trim()
      );
      if (typeof customText !== 'string') setQuestion('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickQuestions = [
    "사람이 죽었나요?",
    "직장 상사와 관련 있나요?",
    "돈과 관련 있나요?",
    "초자연적인 현상인가요?",
    "거짓말이 포함되어 있나요?"
  ];

  const handleRequestHint = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await sessionService.submitMysteryQuestion(
        session.id, 
        currentUser.uid, 
        session.players[currentUser.uid]?.nickname || '익명', 
        "힌트를 주세요!"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitGuess = async () => {
    if (!guess.trim() || isCheckingGuess) return;
    setIsCheckingGuess(true);
    try {
      const result = await mysteryService.checkSolution(game.mystery, game.solution, guess.trim());
      if (result.isCorrect) {
        await sessionService.solveMystery(session.id, currentUser.uid);
      } else {
        alert(result.feedback);
      }
      setGuess('');
    } finally {
      setIsCheckingGuess(false);
    }
  };

  if (!game) return null;

  return (
    <div className="flex flex-col h-full bg-[#f3f2f1] font-sans">
      {/* Header */}
      <div className="bg-white border-b border-[#d1d1d1] px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-[#217346] p-2 rounded-lg text-white shadow-md">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-tight">미스테리_보고서_분석.xlsx</h2>
            <p className="text-[10px] text-gray-500 font-bold">사건의 전말을 파헤치십시오.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-gray-400 uppercase">분석_진척도</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700">{Object.keys(game.questions || {}).length} / 20</span>
              <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                <div 
                  className="h-full bg-[#217346] transition-all duration-500" 
                  style={{ width: `${Math.min((Object.keys(game.questions || {}).length / 20) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 px-3 py-1 rounded-full flex items-center gap-2">
            <Search size={14} className="text-blue-600" />
            <span className="text-[10px] font-bold text-blue-700">분석 진행 중</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row p-4 lg:p-6 gap-6">
        {/* Left Side: Mystery & Questions */}
        <div className="flex-1 flex flex-col gap-6 min-h-0">
          {/* Mystery Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-2 border-[#217346] rounded-xl shadow-xl overflow-hidden flex-shrink-0"
          >
            <div className="bg-[#217346] px-4 py-2 flex items-center gap-2">
              <AlertCircle size={16} className="text-white" />
              <span className="text-[10px] font-black text-white uppercase">기이한_상황_보고</span>
            </div>
            <div className="p-6">
              <p className="text-lg md:text-xl font-bold text-gray-800 leading-relaxed text-center italic">
                "{game.mystery}"
              </p>
            </div>
          </motion.div>

          {/* Questions List */}
          <div className="flex-1 bg-white border border-[#d1d1d1] rounded-xl shadow-lg flex flex-col min-h-0 overflow-hidden">
            <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-gray-500" />
                <span className="text-[10px] font-black text-gray-600 uppercase">조사_질의응답_로그</span>
              </div>
              <span className="text-[9px] font-bold text-gray-400">총 {Object.keys(game.questions || {}).length}개의 질문</span>
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              <AnimatePresence initial={false}>
                {Object.values(game.questions || {}).sort((a, b) => a.timestamp - b.timestamp).map((q) => (
                  <motion.div 
                    key={q.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 shrink-0 border border-gray-200">
                        <HelpCircle size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-gray-800">{q.nickname}</span>
                          <span className="text-[8px] text-gray-400">{new Date(q.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg rounded-tl-none inline-block max-w-full">
                          <p className="text-sm text-gray-700">{q.text}</p>
                        </div>
                      </div>
                    </div>

                    {/* AI Answer */}
                    <div className="flex justify-end pr-4">
                      <div className="flex items-start gap-3 flex-row-reverse max-w-[80%]">
                        <div className="w-8 h-8 bg-[#217346] rounded-full flex items-center justify-center text-white shrink-0 shadow-md">
                          <FileText size={16} />
                        </div>
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-2 mb-1">
                            <span className="text-[10px] font-black text-[#217346]">AI_작성자</span>
                          </div>
                          <div className={`p-3 rounded-lg rounded-tr-none inline-block border shadow-sm ${
                            q.answer === 'YES' ? 'bg-green-50 border-green-200 text-green-700' :
                            q.answer === 'NO' ? 'bg-red-50 border-red-200 text-red-700' :
                            q.answer === 'HINT' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                            'bg-gray-50 border-gray-200 text-gray-500 italic'
                          }`}>
                            {!q.answer ? (
                              <div className="flex items-center gap-2">
                                <Loader2 size={12} className="animate-spin" />
                                <span className="text-xs">분석 중...</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                {q.answer === 'YES' && <CheckCircle2 size={14} />}
                                {q.answer === 'NO' && <XCircle size={14} />}
                                {q.answer === 'IRRELEVANT' && <MinusCircle size={14} />}
                                {q.answer === 'HINT' && <Lightbulb size={14} />}
                                <span className="text-sm font-bold">
                                  {q.answer === 'YES' ? '예' : 
                                   q.answer === 'NO' ? '아니오' : 
                                   q.answer === 'HINT' ? '힌트' : '관련 없음'}
                                </span>
                                {q.hintText && <span className="text-xs font-normal ml-1 border-l border-current pl-2">{q.hintText}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {Object.keys(game.questions || {}).length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2 opacity-50">
                  <Search size={48} />
                  <p className="text-sm font-bold">아직 질문이 없습니다. 조사를 시작하세요!</p>
                </div>
              )}
            </div>

            {/* Input Area */}
            {game.status === 'PLAYING' && (
              <div className="p-4 bg-[#f8f9fa] border-t border-[#d1d1d1] space-y-3">
                {/* Quick Questions */}
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[9px] font-black text-gray-400 uppercase mr-1">빠른_질문:</span>
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSubmitQuestion(q)}
                      disabled={isSubmitting}
                      className="text-[9px] font-bold bg-white border border-gray-200 px-2 py-1 rounded-full hover:border-[#217346] hover:text-[#217346] transition-colors disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                  <button
                    onClick={handleRequestHint}
                    disabled={isSubmitting}
                    className="text-[9px] font-bold bg-yellow-50 border border-yellow-200 text-yellow-700 px-2 py-1 rounded-full hover:bg-yellow-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    <Lightbulb size={10} />
                    힌트_요청
                  </button>
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="예/아니오로 대답할 수 있는 질문을 입력하세요..."
                    className="flex-1 bg-white border border-[#d1d1d1] rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#217346] shadow-inner"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmitQuestion()}
                  />
                  <button 
                    onClick={() => handleSubmitQuestion()}
                    disabled={!question.trim() || isSubmitting}
                    className="bg-[#217346] text-white p-2 rounded-lg hover:bg-[#1a5a36] transition-colors disabled:opacity-50 shadow-md"
                  >
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                  </button>
                </div>
                <p className="text-[9px] text-gray-400 mt-2 text-center font-bold">
                  * AI 작성자는 "예", "아니오", "관련 없음"으로만 대답합니다.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Guess & Solution */}
        <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
          {/* Guess Card */}
          <div className="bg-white border border-[#d1d1d1] rounded-xl shadow-lg overflow-hidden flex flex-col">
            <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-3">
              <div className="flex items-center gap-2">
                <Lightbulb size={16} className="text-yellow-500" />
                <span className="text-[10px] font-black text-gray-600 uppercase">최종_사건_추론</span>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-[11px] text-gray-500 leading-tight">
                사건의 전말을 파악하셨나요? 핵심적인 이유를 포함하여 추론을 제출하십시오.
              </p>
              <textarea 
                className="w-full h-32 bg-gray-50 border border-[#d1d1d1] rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#217346] resize-none shadow-inner"
                placeholder="여기에 추론 내용을 작성하세요..."
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                disabled={game.status !== 'PLAYING'}
              />
              <button 
                onClick={handleSubmitGuess}
                disabled={!guess.trim() || isCheckingGuess || game.status !== 'PLAYING'}
                className="w-full bg-[#217346] text-white py-3 rounded-lg font-black text-sm hover:bg-[#1a5a36] transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCheckingGuess ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                추론_제출_및_검증
              </button>
            </div>
          </div>

          {/* Solution Card (Visible when solved) */}
          <AnimatePresence>
            {game.status === 'SOLVED' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 border-2 border-green-500 rounded-xl shadow-2xl overflow-hidden"
              >
                <div className="bg-green-500 px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-white" />
                    <span className="text-[10px] font-black text-white uppercase">사건_종결_보고서</span>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-green-600 uppercase mb-1">최초_해결자</p>
                    <p className="text-lg font-black text-gray-800">{session.players[game.winnerId!]?.nickname}</p>
                  </div>
                  <div className="h-px bg-green-200" />
                  <div>
                    <p className="text-[10px] font-bold text-green-600 uppercase mb-2">사건의_전말</p>
                    <p className="text-sm text-gray-700 leading-relaxed font-medium">
                      {game.solution}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
            <h4 className="text-[10px] font-black text-blue-700 uppercase mb-2 flex items-center gap-2">
              <AlertCircle size={12} /> 수사_가이드라인
            </h4>
            <ul className="text-[10px] text-blue-600 space-y-1 font-medium">
              <li>• "예/아니오"로 대답 가능한 질문을 하세요.</li>
              <li>• 상황의 모순점을 찾아 집중 공략하세요.</li>
              <li>• AI가 주는 힌트를 놓치지 마세요.</li>
              <li>• 동료 조사관들의 질문을 참고하세요.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
