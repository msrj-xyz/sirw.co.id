import { Router } from 'express';
import multer from 'multer';
import requireAuth from '../middleware/auth';

const upload = multer({ dest: '/tmp/uploads' });
const router = Router();

router.post('/', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));
router.get('/', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));
router.get('/:id', requireAuth, (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));
router.post('/:id/gallery', requireAuth, upload.single('file'), (req, res) => res.status(501).json({ status: 'error', error: { message: 'Not implemented' } }));

export default router;
