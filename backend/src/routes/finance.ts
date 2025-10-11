import { Router } from 'express';
import multer from 'multer';
import requireAuth from '../middleware/auth';

const upload = multer({ dest: '/tmp/uploads' });
const router = Router();

router.get('/fee-types', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));
router.post('/transactions', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));
router.post('/transactions/upload-proof', requireAuth, upload.single('file'), (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));
router.get('/transactions', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));
router.patch('/transactions/:id/verify', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));

export default router;
