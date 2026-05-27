import React, { useState } from 'react';
import { UserProfile } from '../types';
import { AvatarPicker, Avatar } from './AvatarPicker';
import { Sparkles, User, Tag, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

const PRESET_INTERESTS = ['Gaming', 'Anime', 'Music', 'Art', 'Travel', 'Coding', 'Outdoors', 'Cooking', 'Space', 'Crypto', 'Movies', 'Sports'];

interface ProfileSetupProps {
  onComplete: (user: UserProfile) => void;
  initialUser?: UserProfile;
}

export function ProfileSetup({ onComplete, initialUser }: ProfileSetupProps) {
  const [username, setUsername] = useState(initialUser?.username || '');
  const [bio, setBio] = useState(initialUser?.bio || 'Hey there! I\'m excited to meet new people on VibeChat 🔮');
  const [avatarIndex, setAvatarIndex] = useState(initialUser?.avatarIndex ?? Math.floor(Math.random() * 8));
  const [selectedInterests, setSelectedInterests] = useState<string[]>(initialUser?.interests || []);
  const [customInterest, setCustomInterest] = useState('');

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest].slice(0, 10) // Limit to 10
    );
  };

  const addCustomInterest = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customInterest.trim();
    if (clean && !selectedInterests.includes(clean)) {
      setSelectedInterests(prev => [...prev, clean].slice(0, 10));
      setCustomInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setSelectedInterests(prev => prev.filter(i => i !== interest));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    const finalUser: UserProfile = {
      id: initialUser?.id || `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      username: username.trim(),
      bio: bio.trim(),
      interests: selectedInterests,
      avatarIndex,
      isOnline: true,
      lastActive: Date.now(),
      isAdmin: initialUser?.isAdmin || false,
    };

    onComplete(finalUser);
  };

  return (
    <div className="flex items-center justify-center min-h-[90vh] p-4 text-zinc-100">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden"
      >
        {/* Background glow flares */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-tr from-violet-600 to-pink-500 rounded-xl text-white shadow-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-violet-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
              {initialUser ? 'Customize Profile' : 'Setup Profile'}
            </h2>
            <p className="text-xs text-gray-400">Introduce yourself to start chatting matching groups</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Area */}
          <div className="flex flex-col md:flex-row items-center gap-5 bg-zinc-800/40 border border-zinc-800/50 p-4 rounded-xl">
            <div className="flex-shrink-0">
              <Avatar index={avatarIndex} username={username || 'V'} size="xl" />
            </div>
            <div className="flex-1 w-full pl-1">
              <AvatarPicker selectedIndex={avatarIndex} onSelect={setAvatarIndex} username={username || 'U'} />
            </div>
          </div>

          <div className="space-y-4">
            {/* Username Input */}
            <div className="relative">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5 pl-1">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
                <input
                  type="text"
                  maxLength={18}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_\-]/g, ''))}
                  placeholder="Enter username (letters, numbers, underscores)"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl outline-none text-zinc-200 transition text-sm font-medium"
                />
              </div>
            </div>

            {/* Bio input */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5 pl-1">
                Bio / Catchphrase
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="What sets your vibe? Write a quick bio..."
                maxLength={120}
                rows={2}
                className="w-full p-4 bg-zinc-950 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl outline-none text-zinc-300 transition text-sm resize-none"
              />
              <p className="text-right text-[10px] text-zinc-500 mt-1">{bio.length}/120 characters</p>
            </div>

            {/* Interests & tags selector */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5 pl-1">
                Select Your Interests
              </label>

              {/* Added Interests rendering */}
              {selectedInterests.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3 bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800/60">
                  {selectedInterests.map(interest => (
                    <span
                      key={interest}
                      onClick={() => removeInterest(interest)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-violet-500/10 text-violet-300 hover:bg-red-500/20 hover:text-red-300 border border-violet-500/25 transition cursor-pointer"
                    >
                      {interest} ×
                    </span>
                  ))}
                </div>
              )}

              {/* Presets grid */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {PRESET_INTERESTS.map(interest => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition duration-200 ${
                        isSelected
                          ? 'bg-violet-600 text-white shadow shadow-violet-600/30 font-semibold'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>

              {/* Custom tags additions */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Or enter a custom interest..."
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  maxLength={15}
                  className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-lg outline-none text-xs text-zinc-300 transition"
                />
                <button
                  type="button"
                  onClick={addCustomInterest}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 hover:text-white rounded-lg text-xs font-medium text-zinc-300 transition"
                >
                  Add Tag
                </button>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-violet-600 via-pink-600 to-rose-500 text-white rounded-xl text-sm font-semibold tracking-wide shadow-xl shadow-pink-600/20 hover:shadow-pink-600/30 transition duration-300"
          >
            {initialUser ? 'Save Updates' : 'Enter VibeChat Workspace'}
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
