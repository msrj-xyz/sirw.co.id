import winston from 'winston';
import moment from 'moment-timezone';

const timezone = 'Asia/Jakarta';

const timestamp = () => moment().tz(timezone).format('YYYY-MM-DD HH:mm:ss Z');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: timestamp }),
    winston.format.printf(({ timestamp: ts, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `${ts} [${level.toUpperCase()}] ${message}${metaStr}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

export default logger;

export const log = {
  error: (...args: unknown[]) => logger.error(args.map(String).join(' ')),
  warn: (...args: unknown[]) => logger.warn(args.map(String).join(' ')),
  info: (...args: unknown[]) => logger.info(args.map(String).join(' ')),
  debug: (...args: unknown[]) => logger.debug(args.map(String).join(' ')),
};
