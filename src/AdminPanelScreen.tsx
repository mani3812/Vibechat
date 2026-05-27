import React, { useState, useEffect } from 'react';
import { UserProfile, Report, ServerMessage } from '../types';
import { Avatar } from './AvatarPicker';
import { Shield, Users, Radio, AlertCircle, Ban, CheckCircle, Trash2, ShieldX, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminPanelScreenProps {
  socket: WebSocket | null;
  currentUser: UserProfile;
}

export function AdminPanelScreen({ socket, currentUser }: AdminPanelScreenProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAdminData = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      setIsRefreshing(true);
      socket.send(JSON.stringify({ type: 'admin_fetch' }));
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data: ServerMessage = JSON.parse(event.data);
        if (data.type === 'admin_data') {
          setReports(data.reports);
          setUsers(data.users);
        }
      } catch (e) {
        // Safe skip errors
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket]);

  const handleBanToggle = (userId: string, isBanned: boolean) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const confirmMsg = isBanned
        ? `Are you sure you want to lift the ban for this user?`
        : `Confirm Ban: The user will be instantly disconnected and blocked from reconnecting. Proceed?`;
      if (window.confirm(confirmMsg)) {
        socket.send(JSON.stringify({ type: 'admin_ban', userId, ban: !isBanned }));
      }
    }
  };

  return (
    <div className="space-y-6 text-zinc-100">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-3">
        <div>
          <h2 className="text-xl font-black text-red-400 flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-500 animate-pulse" />
            VibeChat Moderation Desk
          </h2>
          <p className="text-xs text-zinc-500">Live monitoring console for bans, audits, and abuse reports</p>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={isRefreshing}
          className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-850 hover:text-white text-xs font-bold font-mono tracking-wide flex items-center gap-1.5 transition active:scale-95 text-zinc-400 disabled:opacity-45"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* Admin Quick Metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-850 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-red-500/10 text-red-500 rounded-lg">
            <AlertCircle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase font-bold">Unresolved Reports</span>
            <span className="text-xl font-black text-zinc-200 leading-none">{reports.filter(r => !r.resolved).length}</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-850 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-violet-500/10 text-violet-500 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase font-bold">Total Registered Users</span>
            <span className="text-xl font-black text-zinc-200 leading-none">{users.length}</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-850 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase font-bold">Online Clients</span>
            <span className="text-xl font-black text-zinc-200 leading-none">
              {users.filter(u => u.isOnline).length} Active
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Pending abuse Reports */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-sm text-zinc-400 uppercase tracking-widest pl-1">Abuse Reports Log</h3>
        
        {reports.length === 0 ? (
          <div className="bg-zinc-900/10 border border-zinc-900 rounded-2xl py-12 text-center text-zinc-650 max-w-md mx-auto">
            <CheckCircle className="w-10 h-10 stroke-zinc-700 mx-auto mb-2" />
            <p className="text-xs font-semibold">Community is completely clean! No reports submitted.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div
                key={r.id}
                className={`bg-zinc-900 border rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4 transition ${
                  r.resolved ? 'border-zinc-850 opacity-60' : 'border-red-500/20 shadow-lg shadow-red-500/2'
                }`}
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="px-2 py-0.5 bg-zinc-950 text-zinc-400 border border-zinc-800 rounded font-semibold text-[10px]">
                      ID: {r.id.slice(4)}
                    </span>
                    <span className="text-xs font-bold text-red-450">&larr; Reported user: {r.reportedId.slice(0, 10)}</span>
                    <span className="text-zinc-650 text-xs">by Reporter {r.reporterId.slice(0, 5)}</span>
                  </div>

                  <p className="text-xs font-semibold text-zinc-200 bg-zinc-950 px-3 py-2 border border-zinc-900/40 rounded-lg">
                    Reason: <span className="text-zinc-350 italic">"{r.reason}"</span>
                  </p>

                  {r.snippet && (
                    <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-900 text-[11px] font-mono select-all">
                      <span className="text-zinc-550 block text-[9px] uppercase font-bold mb-1">Snippet Captured:</span>
                      <p className="text-red-300 line-clamp-2 italic">"{r.snippet}"</p>
                    </div>
                  )}

                  <span className="text-[10px] text-zinc-700 block">
                    Logged: {new Date(r.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Ban Button action */}
                  {(() => {
                    const targetUserProfile = users.find(u => u.id === r.reportedId);
                    const isBanned = targetUserProfile?.isBanned || false;
                    
                    return (
                      <button
                        onClick={() => handleBanToggle(r.reportedId, isBanned)}
                        className={`px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition ${
                          isBanned
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow shadow-emerald-600/10'
                            : 'bg-red-650 hover:bg-red-500 text-white shadow shadow-red-650/10'
                        }`}
                      >
                        <Ban className="w-3.5 h-3.5" />
                        {isBanned ? 'Lift Ban' : 'Ban User'}
                      </button>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* List of Registered accounts to moderate */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-sm text-zinc-400 uppercase tracking-widest pl-1">Accounts Directory</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {users.map((profile) => (
            <div
              key={profile.id}
              className="bg-zinc-900/60 border border-zinc-900 hover:border-zinc-850 p-4 rounded-xl flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar index={profile.avatarIndex} username={profile.username} size="sm" />
                <div className="min-w-0">
                  <span className="font-bold text-zinc-200 text-xs block truncate leading-tight">{profile.username}</span>
                  <span className="text-[10px] text-zinc-500 block truncate font-medium">{profile.bio || 'chatting along'}</span>
                  <span className="text-[9px] font-mono text-zinc-650 block">ID: {profile.id.slice(0, 12)}...</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {profile.isBanned ? (
                  <button
                    onClick={() => handleBanToggle(profile.id, true)}
                    className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-400 font-bold text-[10px] rounded-lg transition"
                  >
                    Unban Account
                  </button>
                ) : (
                  <button
                    onClick={() => handleBanToggle(profile.id, false)}
                    className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-550/20 border border-red-500/20 text-red-400 font-bold text-[10px] rounded-lg transition"
                  >
                    Ban Account
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
