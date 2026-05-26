import React from 'react';
import { UserProfile, FriendRequest } from '../types';
import { Avatar } from './AvatarPicker';
import { UserCheck, UserX, MessageSquare, Clock, Heart, Sparkles, Smile, Users, Compass } from 'lucide-react';
import { motion } from 'motion/react';

interface FriendsListScreenProps {
  currentUser: UserProfile;
  friendRequests: FriendRequest[];
  friends: UserProfile[];
  onRespondFriendRequest: (requestId: string, accept: boolean) => void;
  onSelectTab: (tab: string) => void;
}

export function FriendsListScreen({
  currentUser,
  friendRequests,
  friends,
  onRespondFriendRequest,
  onSelectTab,
}: FriendsListScreenProps) {
  // Incoming requests that are pending
  const incomingPending = friendRequests.filter(
    r => r.receiverId === currentUser.id && r.status === 'pending'
  );

  // Outgoing requests that are pending
  const outgoingPending = friendRequests.filter(
    r => r.senderId === currentUser.id && r.status === 'pending'
  );

  return (
    <div className="space-y-6 text-zinc-200">
      
      {/* Invitations Notification Panel */}
      {incomingPending.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <h4 className="font-extrabold text-amber-400 text-sm flex items-center gap-2 mb-3">
            <UserCheck className="w-4 h-4 animate-bounce" />
            Pending Friend Requests ({incomingPending.length})
          </h4>

          <div className="space-y-2.5">
            {incomingPending.map((req) => {
              // Fetch sender profile info
              return (
                <div
                  key={req.id}
                  className="bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <Avatar index={Math.floor(Math.random() * 8)} username={req.senderId} size="sm" />
                    <div>
                      <span className="font-bold text-zinc-100 text-xs block">Request from: {req.senderId.slice(0, 12)}</span>
                      <span className="text-[10px] text-zinc-500 block">Sent recently</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onRespondFriendRequest(req.id, true)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition duration-200"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => onRespondFriendRequest(req.id, false)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 rounded-lg text-xs transition duration-200"
                    >
                      Ignore
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Friends list header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
        <div>
          <h2 className="text-xl font-black text-zinc-100 flex items-center gap-2">
            <Users className="w-5.5 h-5.5 text-violet-400" />
            Vibe Friends ({friends.length})
          </h2>
          <p className="text-xs text-zinc-500">Your network of permanent friend connections</p>
        </div>

        <button
          onClick={() => onSelectTab('random')}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 hover:text-white border border-zinc-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition active:scale-95"
        >
          <Compass className="w-4 h-4 text-pink-400" />
          Meet More People
        </button>
      </div>

      {/* Grid of Friends */}
      {friends.length === 0 ? (
        <div className="bg-zinc-900/10 border border-zinc-900 rounded-2xl py-16 px-4 text-center text-zinc-400 max-w-lg mx-auto">
          <Heart className="w-12 h-12 stroke-zinc-700 bg-red-950/20 text-red-400/50 p-3 rounded-full mx-auto mb-3 animate-pulse" />
          <h3 className="font-bold text-zinc-200 text-sm">No friends added yet</h3>
          <p className="text-xs text-zinc-500 mt-2 max-w-sm mx-auto">
            Friends are created by tapping the "Add Friend" button during your anonymous chats when matching. Start matchmaking to fill your connections!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {friends.map((friend) => (
            <motion.div
              key={friend.id}
              whileHover={{ y: -2 }}
              className="bg-zinc-900/40 border border-zinc-900 hover:border-zinc-800 rounded-2xl p-4 flex gap-4 transition duration-200 relative overflow-hidden group shadow"
            >
              <div className="relative flex-shrink-0">
                <Avatar index={friend.avatarIndex} username={friend.username} size="lg" />
                {friend.isOnline ? (
                  <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-zinc-950 rounded-full" />
                ) : (
                  <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-zinc-650 border-2 border-zinc-950 rounded-full" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h4 className="font-bold text-zinc-200 text-sm leading-tight truncate">{friend.username}</h4>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded leading-none ${
                    friend.isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {friend.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                
                <p className="text-[11px] text-zinc-400 italic font-medium line-clamp-1 mb-2">
                  {friend.bio || 'Happy to connect on VibeChat! 🎉'}
                </p>

                {/* Sub-tags */}
                <div className="flex flex-wrap gap-1 mb-4 select-none">
                  {friend.interests.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[9px] font-medium bg-zinc-950 px-2 py-0.5 rounded border border-zinc-850 text-zinc-400">
                      #{tag}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => onSelectTab('messages')}
                  className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 hover:text-white border border-zinc-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 group-hover:bg-violet-600 group-hover:text-white group-hover:border-transparent"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Chat Privately
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Outgoing invitations */}
      {outgoingPending.length > 0 && (
        <div className="mt-8 border-t border-zinc-900 pt-6">
          <h4 className="font-extrabold text-zinc-400 text-xs uppercase tracking-wider mb-3">
            Outgoing Pending Invitations ({outgoingPending.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {outgoingPending.map((req) => (
              <div
                key={req.id}
                className="bg-zinc-900/20 border border-zinc-900/60 rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-750 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                  ...
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-zinc-300 text-xs block truncate">Sent to: {req.receiverId.slice(0, 15)}</span>
                  <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-500" />
                    Pending review
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
