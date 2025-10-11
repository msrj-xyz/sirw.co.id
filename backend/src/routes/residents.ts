import { Router } from 'express';
import multer from 'multer';
import { createResident, listResidents, getResident, updateResident, deleteResident, importPreview } from '../controllers/residentsController';
import validate from '../middleware/validate';
import { residentCreateSchema } from '../validators/resident';
import requireAuth from '../middleware/auth';
import requireRole from '../middleware/roles';

const router = Router();
const upload = multer({ dest: '/tmp/uploads' });

router.post('/', requireAuth, requireRole('admin_rt', 'admin_rw', 'super_admin'), validate(residentCreateSchema), createResident);
router.get('/', requireAuth, requireRole('admin_rt', 'admin_rw', 'super_admin'), listResidents);
router.get('/:id', requireAuth, getResident);
router.patch('/:id', requireAuth, updateResident);
router.put('/:id', requireAuth, updateResident);
router.delete('/:id', requireAuth, deleteResident);

// CSV import preview (multipart)
router.post('/import/preview', requireAuth, requireRole('admin_rt', 'admin_rw', 'super_admin'), upload.single('file'), importPreview);

router.post('/import', requireAuth, upload.single('file'), async (req, res) => {
  interface MulterFileReq { file?: Express.Multer.File }
  const file = (req as unknown as MulterFileReq).file;
  if (!file) return res.status(400).json({ status: 'error', error: { message: 'file required' } });

  // persist uploaded file to tmp (already saved by multer at dest)
  interface ReqWithUser { user?: { sub?: string } }
  const userPayload = (req as unknown as ReqWithUser).user;
  const job = await import('../queue/index').then(({ residentsImportQueue }) => residentsImportQueue.add({ filePath: file.path, originalName: file.originalname, initiatedBy: userPayload?.sub }));
  // in test environment the queue stub may include result; return it for assertions
  const resp: { jobId: string; result?: unknown } = { jobId: String((job as any).id) };
  if (process.env.NODE_ENV === 'test' && (job as any).result) resp.result = (job as any).result;
  return res.status(202).json({ status: 'success', data: resp });
});

router.get('/import/jobs/:jobId', requireAuth, async (req, res) => {
  const jobId = req.params.jobId;
  const redis = await import('../services/redisClient').then((m) => m.default());
  type RedisGettable = { get?: (key: string) => Promise<string | null> } | null;
  const redisClient = redis as unknown as RedisGettable;
  if (!redisClient || typeof redisClient.get !== 'function') return res.status(200).json({ status: 'success', data: { status: 'unknown' } });
  try {
    const raw = await redisClient.get(`import:job:${jobId}`);
    if (!raw) return res.status(200).json({ status: 'success', data: { status: 'pending' } });
    const meta = JSON.parse(raw as string);
    return res.status(200).json({ status: 'success', data: meta });
  } catch (e) {
    return res.status(500).json({ status: 'error', error: { message: 'Failed to read job status' } });
  }
});

export default router;
