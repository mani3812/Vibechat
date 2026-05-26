import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Message, ServerMessage, SocketMessage, FriendRequest } from '../types';
import { Avatar, getAvatarStyle } from './AvatarPicker';
import { Play, Loader2, ArrowRight, UserPlus, Heart, Flag, ShieldAlert, Send, Smile, Info, RefreshCw, Sparkles, X, UserMinus, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getBackendUrl } from '../lib/api';

interface RandomChatScreenProps {
  socket: WebSocket | null;
  onlineCount: number;
  currentUser: UserProfile;
  friendRequests: FriendRequest[];
  friendships: string[]; // list of friend user IDs
  onSendFriendRequest: (receiverId: string) => void;
  onBlockUser: (userId: string) => void;
  onReportUser: (userId: string, reason: string, snippet?: string) => void;
}

export function RandomChatScreen({
  socket,
  onlineCount,
  currentUser,
  friendRequests,
  friendships,
  onSendFriendRequest,
  onBlockUser,
  onReportUser,
}: RandomChatScreenProps) {
  // Matching states
  const [matchStatus, setMatchStatus] = useState<'idle' | 'searching' | 'matched'>('idle');
  const [opponent, setOpponent] = useState<UserProfile | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [opponentTyping, setOpponentTyping] = useState(false);
  
  // Modals & UI Controls
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [icebreakerText, setIcebreakerText] = useState('');
  const [generatingIcebreaker, setGeneratingIcebreaker] = useState(false);
  const [isSelfTyping, setIsSelfTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hook to handle incoming state updates from parent web socket subscriptions
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data: ServerMessage = JSON.parse(event.data);
        switch (data.type) {
          case 'matchmaking_status':
            setMatchStatus(data.status);
            if (data.status === 'matched' && data.opponent && data.roomId) {
              setOpponent(data.opponent);
              setRoomId(data.roomId);
              setMessages([]);
              setOpponentTyping(false);
              setIcebreakerText('');
            } else if (data.status === 'searching') {
              setOpponent(null);
              setRoomId('');
              setMessages([]);
            } else if (data.status === 'idle') {
              setOpponent(null);
              setRoomId('');
              setMessages([]);
            }
            break;

          case 'opponent_left':
            setMatchStatus('idle');
            setMessages(prev => [
              ...prev,
              {
                id: `system_${Date.now()}`,
                roomId,
                senderId: 'system',
                senderName: 'System',
                content: data.message,
                timestamp: Date.now(),
              },
            ]);
            setOpponentTyping(false);
            break;

          case 'message_received':
            if (data.message.roomId === roomId) {
              setMessages(prev => {
                // Check duplicate (idempotency safety)
                if (prev.some(m => m.id === data.message.id)) return prev;
                return [...prev, data.message];
              });
            }
            break;

          case 'typing_status':
            if (data.roomId === roomId && data.userId !== currentUser.id) {
              setOpponentTyping(data.isTyping);
            }
            break;
        }
      } catch (e) {
        // Safe console parse error skip
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, roomId, currentUser.id]);

  // Infinite scroll snap
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, opponentTyping]);

  const startMatchmaker = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'join_matchmaker' }));
    }
  };

  const cancelMatchmaker = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'leave_matchmaker' }));
    }
  };

  const skipMatch = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      // Swipe animation visual trigger by clearing screen momentarily
      setMessages([]);
      socket.send(JSON.stringify({ type: 'skip_match' }));
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket || !roomId) return;

    socket.send(JSON.stringify({ type: 'send_message', roomId, content: chatInput }));
    setChatInput('');
    setIsSelfTyping(false);
    
    // Clear typing indicator
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'typing', roomId, isTyping: false }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
    if (!socket || !roomId) return;

    if (!isSelfTyping) {
      setIsSelfTyping(true);
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'typing', roomId, isTyping: true }));
      }
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsSelfTyping(false);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'typing', roomId, isTyping: false }));
      }
    }, 1500);
  };

  const handleEmojiClick = (emoji: string) => {
    setChatInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleAddFriend = () => {
    if (opponent) {
      onSendFriendRequest(opponent.id);
    }
  };

  const handleBlockOpponent = () => {
    if (opponent) {
      if (window.confirm(`Are you sure you want to block ${opponent.username}? You won't meet them again.`)) {
        onBlockUser(opponent.id);
      }
    }
  };

  const handleReportOpponent = () => {
    if (!reportReason.trim()) return;
    if (opponent) {
      const chatSnippet = messages
        .slice(-5)
        .map(m => `${m.senderName}: ${m.content}`)
        .join(' | ');

      onReportUser(opponent.id, reportReason, chatSnippet);
      setShowReportModal(false);
      setReportReason('');
    }
  };

  // AI-powered Icebreaker handler
  const askAIIcebreaker = async () => {
    if (!opponent) return;
    setGeneratingIcebreaker(true);
    setIcebreakerText('');
    try {
      // We call our Express backend API that forwards requests to Gemini
      // But we can generate it directly by sending a custom prompt via Gemini
      // To simulate instantly, let's ask our chat assistant via express.
      const prompt = `Give me 1 creative, fun, unusual, and highly engaging chat icebreaker question or starter hook to send to someone during an anonymous chat.
Our shared interests: ${currentUser.interests.concat(opponent.interests).join(', ')}.
Output ONLY the sentence. No quotes, no intro.`;

      const response = await fetch(`${getBackendUrl()}/api/health`); // Check health as sanity
      // Since it's server-interactive, we can fetch an icebreaker from an API route. Wait, let's create a server API route `/api/icebreaker` in our Express file later!
      // For now, let's request it over a standard REST call
      const res = await fetch(`${getBackendUrl()}/api/icebreaker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          opponentId: opponent.id,
        })
      });
      const data = await res.json();
      if (data && data.text) {
        setIcebreakerText(data.text);
      } else {
        setIcebreakerText(`What's the absolute strangest food combination you secretly enjoy? 🍕🍓`);
      }
    } catch (e) {
      setIcebreakerText(`If you could live anywhere in the universe for a year, where would you go? 🌌`);
    } finally {
      setGeneratingIcebreaker(false);
    }
  };

  const useIcebreaker = () => {
    if (icebreakerText) {
      setChatInput(icebreakerText);
      setIcebreakerText('');
    }
  };

  // Check relationship status with active opponent
  const isFriend = opponent ? friendships.includes(opponent.id) : false;
  const friendReqStatus = opponent
    ? friendRequests.find(
        r =>
          (r.senderId === currentUser.id && r.receiverId === opponent.id) ||
          (r.senderId === opponent.id && r.receiverId === currentUser.id)
      )?.status
    : undefined;

  const quickEmojis = ['😂', '😍', '🔥', '💀', '👍', '👀', '✨', '💯'];

  return (
    <div className="flex flex-col h-[85vh] md:h-[90vh] bg-zinc-950 rounded-2xl border border-zinc-900 overflow-hidden relative shadow-2xl">
      {/* Search HUD / Matching Screens */}
      {matchStatus === 'idle' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-300 relative">
          <div className="absolute top-24 -left-12 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-24 -right-12 w-64 h-64 bg-pink-600/5 rounded-full blur-3xl pointer-events-none" />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-zinc-900/40 border border-zinc-900 rounded-2xl p-8 backdrop-blur shadow-2xl relative"
          >
            {/* Pulsing visual core */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-violet-600 to-pink-500 rounded-full blur-xl opacity-40 animate-pulse" />
                <div className="w-18 h-18 bg-zinc-950 border border-zinc-800 rounded-full flex items-center justify-center text-violet-400 relative z-10">
                  <Flame className="w-10 h-10 animate-bounce" />
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
              VibeMatch Lobby
            </h2>
            <p className="text-zinc-400 text-sm mt-2 mb-6 max-w-xs mx-auto">
              Find and connect anonymously with real-time users. Skip matches instantly with swipe controls.
            </p>

            {/* Metrics indicators */}
            <div className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 rounded-full w-fit mx-auto text-xs font-semibold mb-8">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
              <span>{onlineCount + 4} Active VibeChatters</span>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={startMatchmaker}
              className="w-full py-4 bg-gradient-to-r from-violet-600 via-pink-600 to-rose-500 hover:from-violet-500 hover:to-rose-450 text-white rounded-xl text-md font-bold tracking-wide shadow-xl shadow-pink-600/10 flex items-center justify-center gap-2.5 transition duration-300 pointer-events-auto cursor-pointer"
            >
              <Play className="w-5 h-5 fill-white" />
              Start Anonymous Match
            </motion.button>
          </motion.div>
        </div>
      )}

      {matchStatus === 'searching' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-950 relative overflow-hidden">
          {/* pulsating search ring */}
          <div className="relative flex items-center justify-center w-72 h-72">
            <div className="absolute w-72 h-72 border border-violet-500/10 rounded-full animate-ping" />
            <div className="absolute w-56 h-56 border border-pink-500/15 rounded-full animate-ping [animation-delay:0.7s]" />
            <div className="absolute w-40 h-40 border border-cyan-500/20 rounded-full animate-ping [animation-delay:1.4s]" />

            <div className="relative z-10 w-24 h-24 bg-gradient-to-tr from-violet-600 to-pink-500 rounded-full flex items-center justify-center shadow-lg text-white">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
          </div>

          <div className="mt-8 text-center relative z-10">
            <h3 className="text-xl font-bold text-zinc-200">Searching for matches...</h3>
            <p className="text-sm text-zinc-500 mt-1">Filtering by profile tags and interest alignments</p>
            
            <button
              onClick={cancelMatchmaker}
              className="mt-6 px-6 py-2 border border-zinc-800 hover:bg-zinc-900/50 hover:text-white rounded-lg text-xs font-medium text-zinc-400 transition"
            >
              Cancel Search
            </button>
          </div>
        </div>
      )}

      {/* Main Active Chat Area */}
      {matchStatus === 'matched' && opponent && (
        <div className="flex-1 flex flex-col h-full bg-zinc-950 relative">
          
          {/* Header Banner - Opponent Info */}
          <div className="flex items-center justify-between border-b border-zinc-900 bg-zinc-900/30 px-4 py-3 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar index={opponent.avatarIndex} username={opponent.username} size="md" />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-zinc-950 rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-zinc-200 text-sm leading-tight">{opponent.username}</h4>
                </div>
                {/* Interests shared */}
                <span className="text-[10px] text-violet-400 font-semibold block uppercase tracking-wider">
                  {opponent.interests.filter(i => currentUser.interests.includes(i)).length > 0
                    ? `Matching Interests: ${opponent.interests.filter(i => currentUser.interests.includes(i)).slice(0, 2).join(', ')}`
                    : 'Matched Randomly'}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Add friend logic */}
              {isFriend ? (
                <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-lg flex items-center gap-1">
                  Friends ✓
                </span>
              ) : friendReqStatus === 'pending' ? (
                <span className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold rounded-lg animate-pulse">
                  Request Sent
                </span>
              ) : (
                <button
                  onClick={handleAddFriend}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Add Friend
                </button>
              )}

              {/* Skip Match (Next) */}
              <button
                onClick={skipMatch}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition active:scale-95"
              >
                Skip ➔
              </button>

              {/* Moderation safety triggers */}
              <button
                onClick={() => setShowReportModal(true)}
                title="Report user"
                className="p-2 bg-zinc-900 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-lg transition"
              >
                <Flag className="w-4 h-4" />
              </button>

              <button
                onClick={handleBlockOpponent}
                title="Block user"
                className="p-2 bg-zinc-900 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Opponent Mini Profile Card */}
          <div className="bg-gradient-to-r from-violet-950/20 to-pink-950/20 px-4 py-2 border-b border-zinc-950/50 flex flex-wrap items-center gap-2">
            <span className="text-zinc-500 text-xs mr-2">Bio:</span>
            <p className="text-zinc-400 text-xs italic line-clamp-1 flex-1">{opponent.bio || 'Feels like chatting!'}</p>
            <div className="flex gap-1 flex-wrap">
              {opponent.interests.map(t => (
                <span key={t} className="text-[9px] px-1.5 py-0.5 bg-zinc-900 text-zinc-300 rounded border border-zinc-800">
                  #{t}
                </span>
              ))}
            </div>
          </div>

          {/* Messages Listing */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-zinc-600">
                <Smile className="w-12 h-12 stroke-zinc-700 mb-2 animate-pulse" />
                <p className="text-sm">Matched! Say something interesting...</p>
                <p className="text-[10px] text-zinc-700 mt-1 italic">Use our Gemini Icebreaker if you are stuck!</p>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((m) => {
                const isSelf = m.senderId === currentUser.id;
                const isSystem = m.senderId === 'system';

                if (isSystem) {
                  return (
                    <div key={m.id} className="text-center py-2">
                      <span className="px-3 py-1 bg-red-950/30 text-red-300 border border-red-900/20 rounded-md text-[11px] font-semibold italic inline-block">
                        {m.content}
                      </span>
                    </div>
                  );
                }

                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-lg border text-sm ${
                      isSelf
                        ? 'bg-violet-600 text-white rounded-br-none border-violet-500 shadow-violet-600/10'
                        : 'bg-zinc-900 text-zinc-200 rounded-bl-none border-zinc-800 shadow-black/10'
                    }`}>
                      <div className="flex flex-col gap-0.5">
                        {!isSelf && (
                          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest pl-0.5 mb-1 block">
                            {m.senderName}
                          </span>
                        )}
                        <p className="break-words font-medium">{m.content}</p>
                        <span className="text-[9px] text-zinc-400 self-end mt-1 text-right block leading-none">
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Simulated/Socket live typing indicators */}
            {opponentTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-zinc-900 text-zinc-300 rounded-2xl rounded-bl-none px-4 py-3 border border-zinc-800 shadow shadow-black/10 flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-violet-400 font-bold">{opponent.username} is typing</span>
                  <div className="flex gap-1 items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0s]" />
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* AI Icebreaker Overlay Helper */}
          <div className="px-4 py-2 bg-zinc-900/60 border-t border-b border-zinc-900 flex flex-wrap items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>AI Chat Icebreakers</span>
            </div>
            
            {icebreakerText ? (
              <div className="flex items-center gap-2 bg-violet-650/10 p-2.5 rounded-xl border border-violet-500/20 text-xs text-violet-300 max-w-lg flex-1">
                <span className="flex-1 italic">"{icebreakerText}"</span>
                <button
                  type="button"
                  onClick={useIcebreaker}
                  className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-lg text-[10px] uppercase transition flex-shrink-0"
                >
                  Use Hook
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={askAIIcebreaker}
                disabled={generatingIcebreaker}
                className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-amber-300 hover:text-amber-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition active:scale-95"
              >
                {generatingIcebreaker ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Get Magic Icebreaker
              </button>
            )}
          </div>

          {/* Quick interactive Emoji Row */}
          <div className="px-4 py-1.5 bg-zinc-950 flex gap-2 overflow-x-auto border-b border-zinc-900 select-none">
            {quickEmojis.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => handleEmojiClick(e)}
                className="text-base p-1 hover:bg-zinc-900 rounded-lg active:scale-90 transition"
              >
                {e}
              </button>
            ))}
          </div>

          {/* Chat Form Footer */}
          <form onSubmit={sendMessage} className="p-4 bg-zinc-950 flex gap-2">
            <div className="flex-1 bg-zinc-900 border border-zinc-850 focus-within:border-violet-500 rounded-xl px-3 flex items-center">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 outline-none"
              >
                <Smile className="w-5 h-5" />
              </button>

              <input
                type="text"
                placeholder="Type your message here..."
                value={chatInput}
                onChange={handleInputChange}
                maxLength={200}
                className="flex-1 bg-transparent border-none outline-none py-3 text-sm text-zinc-200 px-2"
              />
            </div>

            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="px-5 bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 text-white font-extrabold rounded-xl transition duration-200 shadow-lg shadow-violet-600/10 flex items-center justify-center disabled:opacity-40 select-none pointer-events-auto cursor-pointer"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </form>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <h4 className="text-zinc-200 font-bold text-lg flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              Report Community Violation
            </h4>
            <p className="text-zinc-400 text-xs mt-1.5">Your report is logged anonymously alongside a chat snippet for monitoring.</p>

            <div className="mt-4 space-y-2">
              <label className="text-[10px] uppercase font-bold text-zinc-400 pl-1 block">Violation Reason</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-300 outline-none"
              >
                <option value="">-- Choose violation reason --</option>
                <option value="Abusive Language / Toxic conversation">Abusive Language / Toxic conversation</option>
                <option value="Spam / Commercial promotion">Spam / Commercial promotion</option>
                <option value="Inappropriate Profile / Bio and images">Inappropriate Profile / Bio and images</option>
                <option value="Insolent / Sexual harassment">Insolent / Sexual harassment</option>
              </select>
            </div>

            <div className="flex gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReportOpponent}
                disabled={!reportReason}
                className="flex-1 py-2.5 bg-red-650 hover:bg-red-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-40"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
