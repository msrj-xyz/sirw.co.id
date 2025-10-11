import { Router } from 'express';
import requireAuth from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));
router.get('/', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));
router.get('/:id', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));
router.patch('/:id/assign', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));
router.patch('/:id/status', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));
router.patch('/:id/resolve', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));
router.post('/:id/comments', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));

export default router;
