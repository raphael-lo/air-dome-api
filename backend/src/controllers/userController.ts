import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { createUserInDb, getUserByUsernameFromDb, getUsersFromDb, updateUserInDb, updateUserStatusInDb } from '../models/userModel'; // Import from new model
import { getSitesForUserFromDb } from '../models/userSiteModel';
import { User } from '../models/user'; // Keep User interface import

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
    const userId = await createUserInDb(username, hashedPassword, role || 'Operator', 'active'); // Call model function
    res.status(201).json({ message: 'User created', userId });
  } catch (err: any) {
    if (err.code === '23505') { // Unique violation code for PostgreSQL
      return res.status(409).json({ message: 'Username already exists' });
    }
    console.error("Error in createUser:", err);
    return res.status(500).json({ message: 'Error creating user', error: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const user = await getUserByUsernameFromDb(username); // Call model function

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const assignedSites = await getSitesForUserFromDb(user.id!);

    const token = jwt.sign({
        id: user.id, 
        username: user.username, 
        role: user.role, 
        status: user.status,
        sites: assignedSites
    }, process.env.JWT_SECRET || 'your_jwt_secret');
    res.json({ message: 'Logged in successfully', token });

  } catch (err: any) {
    console.error('Error in login:', err);
    return res.status(500).json({ message: 'Error logging in', error: err.message });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await getUsersFromDb(); // Call model function
    res.json(users);
  } catch (err: any) {
    console.error("Error in getUsers:", err);
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

  try {
    const rowCount = await updateUserInDb(Number(id), fields, params);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User updated successfully' });
  } catch (err: any) {
    console.error('Error in updateUser:', err);
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
    const rowCount = await updateUserStatusInDb(Number(id), status); // Call model function
    if (rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User status updated successfully' });
  } catch (err: any) {
    console.error("Error in updateUserStatus:", err);
    return res.status(500).json({ message: 'Error updating user status', error: err.message });
  }
};
