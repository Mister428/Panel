import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const router = express.Router();
const { JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;

async function ensureAdmin() {
  const exists = await User.findOne({ username: ADMIN_USERNAME });

  if (!exists) {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await User.create({
      username: ADMIN_USERNAME,
      passwordHash: hash,
      role: 'admin',
      approved: true
    });
    console.log('Admin créé:', ADMIN_USERNAME);
  }
}

ensureAdmin().catch(console.error);

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'username et password requis' });
    }

    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: 'Username déjà utilisé' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      passwordHash: hash,
      role: 'user',
      approved: false
    });

    res.json({
      message: 'Compte créé. En attente d’approbation.',
      user: { id: user.id, username }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'Identifiants invalides' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: 'Identifiants invalides' });

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        approved: user.approved
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        approved: user.approved
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;