export interface UserProfile {
  id: string;
  username: string;
  bio: string;
  interests: string[];
  avatarIndex: number; // 0 to 7 pre-made avatars
  isOnline: boolean;
  lastActive: number;
  isBanned?: boolean;
  isAdmin?: boolean;
}

export interface Message {
  id: string;
  roomId: string; // can be "match:[id]" or "dm:[roomId]"
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface Friendship {
  id: string;
  users: [string, string]; // [user1Id, user2Id]
  createdAt: number;
}

export interface Block {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: number;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: string;
  timestamp: number;
  snippet?: string; // last message or context
  resolved: boolean;
}

export type SocketMessage =
  | { type: 'auth'; token: string; user?: UserProfile }
  | { type: 'profile_update'; user: UserProfile }
  | { type: 'join_matchmaker' }
  | { type: 'leave_matchmaker' }
  | { type: 'skip_match' }
  | { type: 'send_message'; roomId: string; content: string }
  | { type: 'typing'; roomId: string; isTyping: boolean }
  | { type: 'friend_request_send'; receiverId: string }
  | { type: 'friend_request_respond'; requestId: string; accept: boolean }
  | { type: 'block_user'; userId: string }
  | { type: 'report_user'; userId: string; reason: string; snippet?: string }
  | { type: 'admin_ban'; userId: string; ban: boolean }
  | { type: 'admin_fetch' };

export type ServerMessage =
  | { type: 'auth_success'; user: UserProfile; allUsers: UserProfile[] }
  | { type: 'user_count'; online: number }
  | { type: 'matchmaking_status'; status: 'idle' | 'searching' | 'matched'; opponent?: UserProfile; roomId?: string }
  | { type: 'opponent_left'; message: string }
  | { type: 'message_received'; message: Message }
  | { type: 'typing_status'; roomId: string; isTyping: boolean; userId: string }
  | { type: 'friend_request_received'; request: FriendRequest; sender: UserProfile }
  | { type: 'friend_request_update'; request: FriendRequest }
  | { type: 'friendship_created'; friendship: Friendship; friend: UserProfile }
  | { type: 'users_update'; users: UserProfile[] }
  | { type: 'blocked_list'; list: string[] }
  | { type: 'admin_data'; reports: Report[]; users: UserProfile[] }
  | { type: 'banned' }
  | { type: 'error'; message: string };
