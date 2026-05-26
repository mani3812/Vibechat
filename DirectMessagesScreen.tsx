import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Message, ServerMessage, SocketMessage, Friendship } from '../types';
import { Avatar } from './AvatarPicker';
import { Search, Send, Smile, ArrowLeft, MoreVertical, MessageSquare, Loader2, ShieldX, Ban, MessageCircleWarning } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getBackendUrl } from '../lib/api';

interface DirectMessagesScreenProps {
  socket: WebSocket | null;
  currentUser: UserProfile;
  friendships: Friendship[];
  allUsers: UserProfile[];
  onBlockUser: (userId: string) => void;
  onReportUser: (userId: string, reason: string, snippet?: string) => void;
}

export function DirectMessagesScreen({
  socket,
  currentUser,
  friendships,
  allUsers,
  onBlockUser,
  onReportUser,
}: DirectMessagesScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriendship, setSelectedFriendship] = useState<Friendship | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [currentTyping, setCurrentTyping] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isSelfTyping, setIsSelfTyping] = useState(false);

  // Responsive: on mobile, let's track if we are in list view or active chat view
  const [isMobileChatActive, setIsMobileChatActive] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load previous messages from server when a friendship is clicked
  useEffect(() => {
    if (!selectedFriendship) {
      setMessages([]);
      return;
    }

    const roomId = `dm:${selectedFriendship.id}`;
    // Fetch via REST API
    fetch(`${getBackendUrl()}/api/messages/${roomId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMessages(data);
        }
      })
      .catch(e => console.error('Error fetching DM messages:', e));
  }, [selectedFriendship]);

  // WebSocket message synchronization for inbox items
  useEffect(() => {
    if (!socket || !selectedFriendship) return;

    const roomId = `dm:${selectedFriendship.id}`;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data: ServerMessage = JSON.parse(event.data);
        if (data.type === 'message_received' && data.message.roomId === roomId) {
          setMessages(prev => {
            if (prev.some(m => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
        } else if (data.type === 'typing_status' && data.roomId === roomId) {
          const friendId = selectedFriendship.users.find(id => id !== currentUser.id);
          if (data.userId === friendId) {
            setCurrentTyping(data.isTyping);
          }
        }
      } catch (e) {
        // Safe skip errors
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, selectedFriendship, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentTyping]);

  const selectFriendshipHandler = (friendship: Friendship) => {
    setSelectedFriendship(friendship);
    setIsMobileChatActive(true);
    setCurrentTyping(false);
    setShowOptions(false);
  };

  const getFriendProfile = (friendship: Friendship): UserProfile => {
    const friendId = friendship.users.find(id => id !== currentUser.id) || '';
    const u = allUsers.find(item => item.id === friendId);
    return u || {
      id: friendId,
      username: 'Offline User',
      bio: 'This user is offline.',
      interests: [],
      avatarIndex: 0,
      isOnline: false,
      lastActive: 0,
    };
  };

  const filteredFriendships = friendships.filter(f => {
    const friend = getFriendProfile(f);
    return friend.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket || !selectedFriendship) return;

    const roomId = `dm:${selectedFriendship.id}`;
    socket.send(JSON.stringify({ type: 'send_message', roomId, content: chatInput }));
    
    setChatInput('');
    setIsSelfTyping(false);
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'typing', roomId, isTyping: false }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
    if (!socket || !selectedFriendship) return;

    const roomId = `dm:${selectedFriendship.id}`;
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

  const blockAndClose = () => {
    if (selectedFriendship) {
      const friend = getFriendProfile(selectedFriendship);
      if (window.confirm(`Are you sure you want to block ${friend.username}? This will disconnect your friends list.`)) {
        onBlockUser(friend.id);
        setSelectedFriendship(null);
        setIsMobileChatActive(false);
      }
    }
  };

  const reportAndFlag = () => {
    if (selectedFriendship) {
      const friend = getFriendProfile(selectedFriendship);
      const reason = window.prompt(`Report ${friend.username}. Please enter details / reason:`);
      if (reason && reason.trim()) {
        const snippet = messages.slice(-5).map(m => `${m.senderName}: ${m.content}`).join(' | ');
        onReportUser(friend.id, reason.trim(), snippet);
        alert('Report logged. Thank you for keeping VibeChat safe!');
      }
    }
  };

  const quickEmojis = ['😂', '🔥', '💀', '👍', '❤️', '👀'];

  return (
    <div className="flex bg-zinc-950 border border-zinc-900 rounded-2xl h-[85vh] md:h-[90vh] overflow-hidden shadow-2xl relative">
      
      {/* Sidebar List - Friends Inbox */}
      <div className={`w-full md:w-80 border-r border-zinc-900 flex flex-col h-full bg-zinc-900/10 ${
        isMobileChatActive ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="p-4 border-b border-zinc-900">
          <h3 className="font-bold text-zinc-100 text-lg">Inbox DMs</h3>
          <p className="text-zinc-500 text-xs mt-0.5 mb-3">Your permanent connections</p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4.5 h-4.5" />
            <input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl outline-none text-zinc-300 placeholder:text-zinc-600 focus:border-violet-500 transition text-xs"
            />
          </div>
        </div>

        {/* Friend List Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/40">
          {filteredFriendships.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-600 px-4 text-center">
              <MessageSquare className="w-10 h-10 mb-2 stroke-zinc-700" />
              <p className="text-xs">No active conversations found.</p>
              <p className="text-[10px] text-zinc-700 mt-1 max-w-[180px]">
                Add friends during your random matchmaking chats to unlock DM channels!
              </p>
            </div>
          ) : (
            filteredFriendships.map((f) => {
              const friend = getFriendProfile(f);
              const isActive = selectedFriendship?.id === f.id;
              
              return (
                <button
                  key={f.id}
                  onClick={() => selectFriendshipHandler(f)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-zinc-900/35 transition text-left relative ${
                    isActive ? 'bg-zinc-900/60 border-l-4 border-violet-600 pl-3' : ''
                  }`}
                >
                  <div className="relative">
                    <Avatar index={friend.avatarIndex} username={friend.username} size="md" />
                    {friend.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-zinc-950 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="font-bold text-zinc-200 text-xs leading-none">{friend.username}</span>
                      <span className="text-[9px] text-zinc-600 leading-none">
                        {friend.isOnline ? 'Active' : 'Offline'}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 italic line-clamp-1">{friend.bio}</p>
                    {/* overlap match counts */}
                    <div className="flex gap-1 mt-1">
                      {friend.isOnline ? (
                        <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1 rounded uppercase tracking-wider">
                          online
                        </span>
                      ) : (
                        <span className="text-[8px] font-medium text-zinc-500 bg-zinc-900 px-1 rounded uppercase tracking-wider">
                          offline
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Primary chat viewport */}
      <div className={`flex-1 flex flex-col h-full bg-zinc-950 ${
        isMobileChatActive ? 'flex' : 'hidden md:flex'
      }`}>
        <AnimatePresence mode="wait">
          {selectedFriendship ? (
            <motion.div
              key={selectedFriendship.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col h-full relative"
            >
              {/* Header */}
              {(() => {
                const friend = getFriendProfile(selectedFriendship);
                return (
                  <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-900 bg-zinc-900/20 backdrop-blur">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsMobileChatActive(false)}
                        className="p-1 text-zinc-400 hover:text-zinc-200 md:hidden block hover:bg-zinc-900 rounded-lg mr-1 transition"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>

                      <div className="relative">
                        <Avatar index={friend.avatarIndex} username={friend.username} size="sm" />
                        {friend.isOnline && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-zinc-950 rounded-full" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-200 text-xs leading-tight">{friend.username}</h4>
                        <span className="text-[9px] text-zinc-500 block leading-tight">
                          {friend.isOnline ? '🟢 Connected online' : '🔴 Currently offline'}
                        </span>
                      </div>
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => setShowOptions(!showOptions)}
                        className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-zinc-200 transition"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {showOptions && (
                        <div className="absolute right-0 mt-1.5 w-44 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-20 py-1 text-xs">
                          <button
                            onClick={blockAndClose}
                            className="w-full px-3.5 py-2.5 hover:bg-zinc-805 text-red-400 hover:text-red-350 font-semibold text-left flex items-center gap-2"
                          >
                            <Ban className="w-4 h-4" />
                            Block Connection
                          </button>
                          <button
                            onClick={reportAndFlag}
                            className="w-full px-3.5 py-2.5 hover:bg-zinc-805 text-amber-500 hover:text-amber-450 font-semibold text-left flex items-center gap-2"
                          >
                            <MessageCircleWarning className="w-4 h-4" />
                            Report User
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="bg-zinc-950 border-b border-zinc-900 px-4 py-2 flex flex-wrap gap-1.5 justify-start select-none">
                <span className="text-[10px] text-zinc-500 font-semibold mr-1">Interests:</span>
                {getFriendProfile(selectedFriendship).interests.map(t => (
                  <span key={t} className="text-[9px] px-1.5 py-0.5 bg-zinc-900 text-zinc-400 border border-zinc-850 rounded">
                    #{t}
                  </span>
                ))}
              </div>

              {/* Messages Listing */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-zinc-700">
                    <p className="text-xs font-semibold">Beginning of secure DM history.</p>
                    <p className="text-[10px] text-zinc-800 mt-1">Send a nice greeting to unlock some chatter! 🥂</p>
                  </div>
                )}

                {messages.map((m) => {
                  const isSelf = m.senderId === currentUser.id;
                  return (
                    <div key={m.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow border text-xs leading-relaxed ${
                        isSelf
                          ? 'bg-gradient-to-tr from-violet-600 to-indigo-650 text-white rounded-br-none border-violet-500'
                          : 'bg-zinc-900 text-zinc-200 rounded-bl-none border-zinc-800'
                      }`}>
                        <p className="break-words font-medium">{m.content}</p>
                        <span className="text-[8px] text-zinc-500 block text-right mt-1 leading-none">
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {currentTyping && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-semibold tracking-wider rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1.5 shadow">
                      <span>{getFriendProfile(selectedFriendship).username} is typing</span>
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0s]" />
                        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Emojis input */}
              <div className="px-4 py-1.5 border-t border-zinc-900 bg-zinc-950 flex gap-2.5 overflow-x-auto select-none">
                {quickEmojis.map(e => (
                  <button
                    key={e}
                    onClick={() => setChatInput(prev => prev + e)}
                    className="p-1 hover:bg-zinc-900 rounded-lg text-sm transition active:scale-90"
                  >
                    {e}
                  </button>
                ))}
              </div>

              {/* Chat Input form Footer */}
              <form onSubmit={handleSendMessage} className="p-4 bg-zinc-900/10 border-t border-zinc-900 flex gap-2">
                <input
                  type="text"
                  placeholder="Type a private message..."
                  value={chatInput}
                  onChange={handleInputChange}
                  maxLength={150}
                  className="flex-1 bg-zinc-900 border border-zinc-850 rounded-xl px-4 py-3 text-xs outline-none text-zinc-200 focus:border-violet-500 transition"
                />

                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="px-5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-xs font-extrabold flex items-center justify-center transition disabled:opacity-45 select-none hover:opacity-90 active:scale-95 pointer-events-auto cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-zinc-500">
              <MessageSquare className="w-14 h-14 mb-3.5 stroke-zinc-700 animate-pulse" />
              <h4 className="font-bold text-zinc-300">Permanent Direct Messages</h4>
              <p className="text-xs text-zinc-600 text-center max-w-xs mt-1.5">
                Select a friend from the left panel to display safe, offline-persistent DM conversation channels.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
