import express from 'express';
import User from '../models/User.js';
import { authRequired, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authRequired, requireAdmin);

router.get('/users', async (req, res) => {
  const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
  res.json(users);
});

router.post('/users/:id/approve', async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { approved: true },
    { new: true }
  ).select('-passwordHash');

  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  res.json(user);
});

router.post('/users/:id/reject', async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { approved: false },
    { new: true }
  ).select('-passwordHash');

  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  res.json(user);
});

router.delete('/users/:id', async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'Utilisateur supprimé' });
});

export default router;