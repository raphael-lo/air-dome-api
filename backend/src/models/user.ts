export interface User {
  id?: number;
  username: string;
  password: string;
  role?: 'Admin' | 'Operator' | 'Viewer';
  sites?: string[];
  status?: 'active' | 'disabled';
  created_at?: string;
}
