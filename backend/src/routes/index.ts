import { Router } from 'express';
import authRoutes from './auth';
import residentsRoutes from './residents';
import announcementsRoutes from './announcements';
import complaintsRoutes from './complaints';
import eventsRoutes from './events';
import lettersRoutes from './letters';
import financeRoutes from './finance';
import usersRoutes from './users';
import adminRoutes from './admin';

const router = Router();

router.use('/auth', authRoutes);
router.use('/residents', residentsRoutes);
router.use('/announcements', announcementsRoutes);
router.use('/complaints', complaintsRoutes);
router.use('/events', eventsRoutes);
router.use('/letters', lettersRoutes);
router.use('/finance', financeRoutes);
router.use('/users', usersRoutes);
router.use('/admin', adminRoutes);

router.get('/health', (req, res) => res.json({ status: 'ok' }));

export default router;
