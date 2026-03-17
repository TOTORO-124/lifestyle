import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Minimize2, Maximize2, Smile } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { Session, ChatMessage } from '../types';
import { sessionService } from '../services/sessionService';

interface ChatProps {
  session: Session;
  currentUser: { uid: string; displayName: string } | null;
  nickname: string;
  isSpectator: boolean;
  isSuika?: boolean;
}

export const Chat: React.FC<ChatProps> = ({ session, currentUser, nickname, isSpectator, isSuika }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastReadTimestampRef = useRef<number>(Date.now());
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const messages = session.messages 
    ? (Object.values(session.messages) as ChatMessage[])
        .filter(msg => isSpectator || !msg.isSpectatorChat) // Spectators see all, alive see only non-spectator
        .sort((a, b) => a.timestamp - b.timestamp)
    : [];

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      lastReadTimestampRef.current = Date.now();
      setUnreadCount(0);
    } else {
      // Calculate unread messages
      const unread = messages.filter(m => m.timestamp > lastReadTimestampRef.current).length;
      setUnreadCount(unread);
    }
  }, [messages.length, isOpen, isMinimized]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || !currentUser) return;

    try {
      await sessionService.sendMessage(
        session.id, 
        currentUser.uid, 
        nickname, 
        message.trim(),
        isSpectator // Pass isSpectator status
      );
      setMessage('');
      setShowEmojiPicker(false);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setMessage((prev) => prev + emojiData.emoji);
    // Keep picker open for multiple emojis or close it? usually keep it open
  };

  if (!currentUser) return null;

  return (
    <>
      {/* Floating Chat Button (when closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed ${isSuika ? 'bottom-40 md:bottom-36' : 'bottom-24 md:bottom-20'} right-6 z-50 ${isSpectator ? 'bg-gray-600 hover:bg-gray-700' : 'bg-[#217346] hover:bg-[#1e6b41]'} text-white p-4 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center group`}
        >
          <MessageCircle size={24} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap font-bold">
            {isSpectator ? '관전자 채팅' : '팀 채팅'}
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className={`fixed bottom-0 right-0 md:bottom-6 md:right-6 z-50 w-full md:w-80 bg-white md:rounded-lg shadow-2xl border border-[#d1d1d1] flex flex-col transition-all duration-300 ${
            isMinimized ? 'h-14' : 'h-[70vh] md:h-[500px]'
          }`}
        >
          {/* Header */}
          <div 
            className={`${isSpectator ? 'bg-gray-600' : 'bg-[#217346]'} text-white p-3 rounded-t-lg flex justify-between items-center cursor-pointer`}
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <div className="flex items-center gap-2">
              <MessageCircle size={18} />
              <span className="font-bold text-sm">{isSpectator ? '관전자 채팅' : '팀 채팅'} ({messages.length})</span>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                className="p-1 hover:bg-white/20 rounded"
              >
                {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                className="p-1 hover:bg-white/20 rounded"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 bg-[#f8f9fa] space-y-3 relative">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 text-xs py-8">
                    대화가 없습니다. 첫 메시지를 보내보세요!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === currentUser.uid;
                    const isSpectatorMsg = msg.isSpectatorChat;
                    
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className={`flex items-end gap-1 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div 
                            className={`px-3 py-2 rounded-lg text-sm break-words shadow-sm ${
                              isMe 
                                ? (isSpectatorMsg ? 'bg-gray-500 text-white rounded-tr-none' : 'bg-[#217346] text-white rounded-tr-none')
                                : (isSpectatorMsg ? 'bg-gray-200 border border-gray-300 text-gray-600 rounded-tl-none' : 'bg-white border border-[#d1d1d1] text-gray-800 rounded-tl-none')
                            }`}
                          >
                            {isSpectatorMsg && !isMe && <span className="text-[9px] font-bold block text-gray-500 mb-1">[관전자]</span>}
                            {msg.content}
                          </div>
                          <span className="text-[9px] text-gray-400 min-w-[30px] mb-1">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {!isMe && (
                          <span className="text-[10px] text-gray-500 mt-1 ml-1 font-medium">
                            {msg.senderName}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
                
                {/* Emoji Picker Popup */}
                {showEmojiPicker && (
                  <div ref={emojiPickerRef} className="absolute bottom-2 left-2 z-10 shadow-xl">
                    <EmojiPicker 
                      onEmojiClick={onEmojiClick} 
                      width={300} 
                      height={350}
                      searchDisabled={false}
                      skinTonesDisabled={true}
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                )}
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-[#d1d1d1] flex gap-2 items-center">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <Smile size={20} />
                </button>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={isSpectator ? "관전자들과 대화하세요..." : "메시지를 입력하세요..."}
                  className={`flex-1 px-3 py-2 text-sm border border-[#d1d1d1] rounded focus:outline-none focus:ring-1 ${isSpectator ? 'focus:border-gray-500 focus:ring-gray-500' : 'focus:border-[#217346] focus:ring-[#217346]'}`}
                />
                <button 
                  type="submit"
                  disabled={!message.trim()}
                  className={`${isSpectator ? 'bg-gray-600 hover:bg-gray-700' : 'bg-[#217346] hover:bg-[#1e6b41]'} text-white p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};
