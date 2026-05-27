import React from 'react';
import { Shield, Sparkles, AlertTriangle, EyeOff, Radio, Video, Mic, Smile, Download, Key } from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsScreenProps {
  blockedUserIds: string[];
}

export function SettingsScreen({ blockedUserIds }: SettingsScreenProps) {
  const futurePlans = [
    {
      icon: <Video className="w-5 h-5 text-indigo-400" />,
      title: 'Voice & Video Matchmaking (WebRTC)',
      description: 'Exchange real-time video/audio streams securely using decentralized peer signaling connections.',
      status: 'In development (Beta placeholder)',
    },
    {
      icon: <Mic className="w-5 h-5 text-indigo-400" />,
      title: 'Voice Notes in Private DMs',
      description: 'Record and send encrypted voice notes with high-quality media codecs directly into chats.',
      status: 'Backlog planned',
    },
    {
      icon: <Smile className="w-5 h-5 text-indigo-400" />,
      title: 'Animated Sticks & Giphys Integration',
      description: 'Enhance texting interactions with a modern media selector matching official Tenor/Giphy repositories.',
      status: 'Backlog planned',
    },
    {
      icon: <Download className="w-5 h-5 text-indigo-400" />,
      title: 'PWA & Push Notifications System',
      description: 'Install VibeChat directly to Android/iOS home-screen and receive real-time offline notifications.',
      status: 'Backlog planned',
    }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-zinc-200">
      
      {/* Title */}
      <div className="border-b border-zinc-900 pb-3">
        <h2 className="text-xl font-black text-zinc-100 flex items-center gap-2">
          <Shield className="w-5.5 h-5.5 text-violet-400" />
          General Settings & Safety Controls
        </h2>
        <p className="text-xs text-zinc-500 font-medium">Manage filters, blocks, and preview experimental roadmap items</p>
      </div>

      {/* Safety handbook banner card */}
      <div className="bg-zinc-900/40 border border-zinc-900 p-5 rounded-2xl flex flex-col md:flex-row gap-5">
        <div className="p-3 bg-red-500/10 text-red-400 rounded-xl h-fit">
          <AlertTriangle className="w-6 h-6 animate-pulse" />
        </div>
        <div className="space-y-1.5 flex-1 select-text">
          <h4 className="text-zinc-200 font-bold text-sm">VibeChat Community Safety Rules</h4>
          <p className="text-xs text-zinc-450 leading-relaxed">
            VibeChat is a zero-tolerance social lounge. Unsolicited marketing, abuse, spam, or toxic behaviors result in a hardware ban. Blocked users are permanently avoided in the matchmaking queue.
          </p>
          <ul className="text-[11px] text-zinc-500 list-disc list-inside space-y-1 pt-1 font-medium">
            <li>Never share private addresses, banks, or credentials on random chats.</li>
            <li>Use standard report flags to immediately alert moderators.</li>
            <li>Maintain respect; have fun!</li>
          </ul>
        </div>
      </div>

      {/* Block checklist section */}
      <div className="bg-zinc-900/10 border border-zinc-900 rounded-2xl p-5">
        <h3 className="font-extrabold text-xs uppercase tracking-widest text-zinc-400 flex items-center gap-2 mb-3.5 pl-1">
          <EyeOff className="w-4.5 h-4.5 text-red-500" />
          Blocked Directory ({blockedUserIds.length})
        </h3>

        {blockedUserIds.length === 0 ? (
          <p className="text-zinc-650 text-xs italic pl-1 leading-relaxed">
            You haven't blocked any accounts in this session. When you block during matches of random chats, those profiles are saved here.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {blockedUserIds.map((id) => (
              <div
                key={id}
                className="bg-zinc-950 border border-zinc-900/80 rounded-xl px-4 py-3 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <span className="font-mono text-zinc-400 text-xs block truncate leading-none mb-1">ID: {id.slice(0, 15)}...</span>
                  <span className="text-[10px] text-zinc-650 block uppercase tracking-wider font-bold">status: blocked</span>
                </div>
                {/* Unblock trigger */}
                <p className="text-[10px] text-zinc-600 italic">Blocked in queue</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Experimental roadmap checklist items */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-xs uppercase tracking-widest text-zinc-400 flex items-center gap-2 mb-1 pl-1">
          <Sparkles className="w-4.5 h-4.5 text-amber-400 animate-spin-slow" />
          VibeChat Roadmap Core (Future Highlights)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {futurePlans.map((plan, index) => (
            <div
              key={index}
              className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-5 flex gap-4 transition duration-200"
            >
              <div className="flex-shrink-0 p-2.5 bg-zinc-950 rounded-xl border border-zinc-850 h-fit">
                {plan.icon}
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-zinc-200 text-xs leading-tight">{plan.title}</h4>
                <p className="text-[10px] text-zinc-400 leading-normal">{plan.description}</p>
                <span className="inline-block mt-2 px-2 py-0.5 bg-violet-500/10 text-violet-300 rounded font-bold uppercase text-[8px] tracking-widest">
                  {plan.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
