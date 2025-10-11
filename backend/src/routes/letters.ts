import { Router } from 'express';
import requireAuth from '../middleware/auth';

const router = Router();

router.get('/templates', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));
router.post('/requests', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));
router.get('/requests', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));
router.get('/requests/:id', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));
router.patch('/requests/:id/approve', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));
router.patch('/requests/:id/reject', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));
router.get('/requests/:id/download', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));
router.get('/public/verify/:hash', (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));

export default router;
