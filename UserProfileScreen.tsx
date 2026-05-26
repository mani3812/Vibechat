import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Avatar } from './AvatarPicker';
import { ProfileSetup } from './ProfileSetup';
import { Settings, PenTool, Flame, Tags, ShieldCheck, HeartPulse, UserCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface UserProfileScreenProps {
  currentUser: UserProfile;
  friendCount: number;
  onUpdateProfile: (updated: UserProfile) => void;
  onLogoutAdminToggle: () => void;
}

export function UserProfileScreen({
  currentUser,
  friendCount,
  onUpdateProfile,
  onLogoutAdminToggle,
}: UserProfileScreenProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdateComplete = (updated: UserProfile) => {
    onUpdateProfile(updated);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end px-4">
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold text-zinc-350 transition"
          >
            Cancel Edit
          </button>
        </div>
        <ProfileSetup onComplete={handleUpdateComplete} initialUser={currentUser} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-zinc-200">
      
      {/* Profile Header Widget card */}
      <div className="bg-zinc-900/40 border border-zinc-900 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xl">
        {/* flares */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="flex-shrink-0">
            <Avatar index={currentUser.avatarIndex} username={currentUser.username} size="xl" />
          </div>

          <div className="flex-1 text-center md:text-left min-w-0">
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
              <h2 className="text-2xl font-black text-zinc-100 tracking-tight truncate">{currentUser.username}</h2>
              {currentUser.isAdmin && (
                <span className="w-fit mx-auto md:mx-0 px-2 py-0.5 bg-red-500/15 text-red-400 border border-red-500/20 rounded font-bold uppercase text-[9px] tracking-wider">
                  Admin Core Mod
                </span>
              )}
            </div>

            <p className="text-sm text-zinc-300 font-medium italic mb-4">
              "{currentUser.bio || 'Happy chatting, looking for cool matching vibes!'}"
            </p>

            {/* Metrics pills */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="px-4 py-2 bg-zinc-950 border border-zinc-900 rounded-xl text-center min-w-[80px]">
                <span className="block text-lg font-bold text-violet-400 leading-none">{friendCount}</span>
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Friends</span>
              </div>
              
              <div className="px-4 py-2 bg-zinc-950 border border-zinc-900 rounded-xl text-center min-w-[80px]">
                <span className="block text-lg font-bold text-pink-400 leading-none">Vibe</span>
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Status</span>
              </div>

              <div className="px-4 py-2 bg-zinc-950 border border-zinc-900 rounded-xl text-center min-w-[80px]">
                <span className="block text-lg font-bold text-emerald-400 leading-none">Active</span>
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Now</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button footer */}
        <div className="flex gap-3 mt-8 border-t border-zinc-900/60 pt-5 relative z-10">
          <button
            onClick={() => setIsEditing(true)}
            className="flex-1 py-3 bg-zinc-950 hover:bg-zinc-850 hover:text-white border border-zinc-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <PenTool className="w-4 h-4 text-violet-400" />
            Edit Profile Details
          </button>

          <button
            onClick={onLogoutAdminToggle}
            className="px-4 py-3 bg-zinc-950 hover:bg-zinc-850 hover:text-white border border-zinc-805 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 text-zinc-400 hover:text-zinc-200"
          >
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            {currentUser.isAdmin ? 'Toggle Admin view' : 'Toggle Moderator Role'}
          </button>
        </div>
      </div>

      {/* Selected interests detailed tag card */}
      <div className="bg-zinc-900/10 border border-zinc-900 rounded-2xl p-5">
        <h3 className="font-bold text-zinc-300 text-sm flex items-center gap-2 mb-3.5 pl-1">
          <Tags className="w-4.5 h-4.5 text-violet-400" />
          Configured Interest Tags ({currentUser.interests.length})
        </h3>

        {currentUser.interests.length === 0 ? (
          <p className="text-zinc-650 text-xs italic pl-1">No interests defined. Tap "Edit Profile Details" to select topic alignment tags.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {currentUser.interests.map(interest => (
              <span
                key={interest}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 border border-zinc-850 text-zinc-400"
              >
                #{interest}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Trust & Safety notice card */}
      <div className="bg-zinc-900/10 border border-zinc-900 rounded-2xl p-4 flex gap-4">
        <div className="flex-shrink-0 p-2 bg-gradient-to-tr from-violet-600 to-pink-500 rounded-lg text-white self-start">
          <HeartPulse className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-zinc-300">VibeChat Safety Shield Active</h4>
          <p className="text-[11px] text-zinc-550 leading-relaxed mt-1">
            We use automatic moderation. Abusive texting or spam results in instant system shadowban. Feel free to use block controls during chats, or report any violations to help improve our social matchmaking queue.
          </p>
        </div>
      </div>

    </div>
  );
}
