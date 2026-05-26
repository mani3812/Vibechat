import React from 'react';

export const AVATAR_GRADIENTS = [
  'from-pink-500 to-rose-500',
  'from-purple-600 to-indigo-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-500',
  'from-fuchsia-500 to-purple-600',
  'from-violet-600 to-pink-500',
  'from-green-400 to-cyan-500',
];

interface AvatarPickerProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  username?: string;
}

export function getAvatarStyle(index: number) {
  return AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
}

export function Avatar({ index, username = 'U', size = 'md' }: { index: number; username?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const initials = username.slice(0, 2).toUpperCase();
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  };

  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold text-white bg-gradient-to-tr shadow-lg shadow-black/30 ${getAvatarStyle(index)} ${sizeClasses[size]}`}
    >
      {initials}
    </div>
  );
}

export function AvatarPicker({ selectedIndex, onSelect, username = 'User' }: AvatarPickerProps) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-gray-400">Choose Profile Style</label>
      <div className="grid grid-cols-4 gap-3">
        {AVATAR_GRADIENTS.map((gradient, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelect(idx)}
            className={`relative p-0.5 rounded-full transition duration-300 transform hover:scale-105 active:scale-95 ${
              selectedIndex === idx ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-zinc-900 bg-gradient-to-tr ' + gradient : 'opacity-80 hover:opacity-100'
            }`}
          >
            <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${gradient} flex items-center justify-center font-bold text-white text-sm`}>
              {username.slice(0, 2).toUpperCase() || 'U'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
