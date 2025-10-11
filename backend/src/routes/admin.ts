import { Router } from 'express';
import requireAuth from '../middleware/auth';

const router = Router();

router.get('/users/pending', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));
router.patch('/users/:id/approve', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));
router.patch('/users/:id/reject', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));
router.get('/audit-logs', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));
router.get('/settings', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));
router.patch('/settings', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));

export default router;
