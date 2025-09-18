import db from '../services/databaseService';
import { User } from '../models/user'; // Assuming User interface is defined here or in types.ts

export const createUserInDb = async (username: string, hashedPassword: string, role: string, status: string): Promise<number> => {
  const { rows } = await db.query('INSERT INTO users (username, password, role, status) VALUES ($1, $2, $3, $4) RETURNING id', [username, hashedPassword, role, status]);
  return rows[0].id;
};

export const getUserByUsernameFromDb = async (username: string): Promise<User | undefined> => {
  const { rows } = await db.query('SELECT * FROM users WHERE username = $1', [username]);
  return rows[0];
};

export const getUsersFromDb = async (): Promise<User[]> => {
  const { rows } = await db.query('SELECT id, username, role, status, created_at FROM users', []);
  return rows;
};

export const updateUserInDb = async (id: number, fields: string[], params: any[]): Promise<number> => {
  const updateQuery = `UPDATE users SET ${fields.join(', ')} WHERE id = $${params.length + 1}`;
  const { rowCount } = await db.query(updateQuery, [...params, id]);
  return rowCount ?? 0;
};

export const updateUserStatusInDb = async (id: number, status: string): Promise<number> => {
  const { rowCount } = await db.query('UPDATE users SET status = $1 WHERE id = $2', [status, id]);
  return rowCount ?? 0;
};