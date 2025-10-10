import { Router } from 'express';

const router = Router();

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  // TODO: implement register
  res.json({ status: 'success', message: 'register endpoint (stub)' });
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  // TODO: implement login
  res.json({ status: 'success', message: 'login endpoint (stub)' });
});

export default router;
