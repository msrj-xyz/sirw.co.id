import { Router } from 'express';
import multer from 'multer';
import requireAuth from '../middleware/auth';
import { getMe, updateMe, uploadAvatar, changePassword, enable2fa, verify2fa } from '../controllers/usersController';
import validate from '../middleware/validate';
import { updateProfileSchema, changePasswordSchema } from '../validators/users';

const upload = multer({ dest: '/tmp/uploads' });
const router = Router();

router.get('/me', requireAuth, getMe);
router.patch('/me', requireAuth, validate(updateProfileSchema), updateMe);
router.post('/me/avatar', requireAuth, upload.single('file'), uploadAvatar);
router.post('/me/password', requireAuth, validate(changePasswordSchema), changePassword);
router.post('/me/2fa/enable', requireAuth, enable2fa);
router.post('/me/2fa/verify', requireAuth, verify2fa);

export default router;
