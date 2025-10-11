import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes/index';
import { log } from './lib/logger';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/v1', routes);

// error handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  void _next;
  log.error(err instanceof Error ? err.message : String(err));
  res.status(500).json({ status: 'error', error: { message: 'Internal Server Error' } });
});

export default app;
