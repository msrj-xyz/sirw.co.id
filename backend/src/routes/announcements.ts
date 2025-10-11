import { Router } from 'express';
import requireAuth from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));
router.get('/', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));
router.get('/:id', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));
router.post('/:id/mark-read', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));
router.get('/:id/analytics', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));

export default router;
