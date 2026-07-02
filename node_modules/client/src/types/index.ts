export interface User {
  id: string;
  username: string;
  email: string;
  role: 'student' | 'moderator' | 'admin';
  avatar: string;
  isVerified: boolean;
  createdAt: string;
}

export interface Post {
  _id: string;
  title?: string;
  body: string;
  image?: string;
  author: {
    _id: string;
    username: string;
    avatar: string;
    role: string;
  };
  isAnonymous: boolean;
  tags: string[];
  upvotes: string[];
  downvotes: string[];
  score: number;
  reactions: {
    like: number;
    laugh: number;
    sad: number;
    angry: number;
  };
  reactionUsers: [string, string][]; // Tuple array after Map conversions
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  post: string;
  parentComment: string | null;
  body: string;
  author: {
    _id: string;
    username: string;
    avatar: string;
    role: string;
  };
  isAnonymous: boolean;
  upvotes: string[];
  downvotes: string[];
  score: number;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  _id: string;
  reportedBy: {
    _id: string;
    username: string;
    email: string;
  };
  contentType: 'post' | 'comment';
  post: Post | null;
  comment: Comment | null;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  updatedAt: string;
}

export interface Stats {
  totalUsers: number;
  totalPosts: number;
  totalReports: number;
  chartData: { date: string; posts: number }[];
}
