export interface Feedback {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  status: 'pending' | 'read' | 'replied' | 'archived';
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedbackFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  message: string;
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    submittedAt: Date;
  };
}

export interface FeedbackListResponse {
  success: boolean;
  data: Feedback[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface FeedbackStats {
  total: number;
  pending: number;
  read: number;
  replied: number;
  archived: number;
}
