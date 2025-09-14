import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import db from '../services/databaseService';
import { User } from '../models/user';

export const createUser = async (req: Request, res: Response) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  if (role && !['Admin', 'Operator', 'Viewer'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const { rows } = await db.query('INSERT INTO users (username, password, role, status) VALUES ($1, $2, $3, $4) RETURNING id', [username, hashedPassword, role || 'Operator', 'active']);
    res.status(201).json({ message: 'User created', userId: rows[0].id });
  } catch (err: any) {
    if (err.code === '23505') { // Unique violation code for PostgreSQL
      return res.status(409).json({ message: 'Username already exists' });
    }
    return res.status(500).json({ message: 'Error creating user', error: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const { rows } = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    const user: User = rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, status: user.status }, process.env.JWT_SECRET || 'your_jwt_secret');
    res.json({ message: 'Logged in successfully', token });

  } catch (err: any) {
    console.error('Database error during login:', err.message);
    return res.status(500).json({ message: 'Error logging in', error: err.message });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query('SELECT id, username, role, status, created_at FROM users', []);
    res.json(rows);
  } catch (err: any) {
    return res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, password, role } = req.body;

  if (!username && !password && !role) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  const fields: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (username) {
    fields.push(`username = $${paramIndex++}`);
    params.push(username);
  }

  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    fields.push(`password = $${paramIndex++}`);
    params.push(hashedPassword);
  }

  if (role) {
    if (!['Admin', 'Operator', 'Viewer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    fields.push(`role = $${paramIndex++}`);
    params.push(role);
  }

  params.push(id);
  const updateQuery = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}`;

  try {
    const { rowCount } = await db.query(updateQuery, params);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User updated successfully' });
  } catch (err: any) {
    console.error('Error updating user:', err.message);
    return res.status(500).json({ message: 'Error updating user', error: err.message });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['active', 'disabled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const { rowCount } = await db.query('UPDATE users SET status = $1 WHERE id = $2', [status, id]);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User status updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ message: 'Error updating user status', error: err.message });
  }
};
