import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } from '../config';
import { log } from '../lib/logger';

type Transporter = { sendMail: (opts: { from?: string; to: string; subject: string; text: string }) => Promise<unknown> };
let transporter: Transporter | null = null;
if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  // dynamic import to satisfy eslint no-var-requires
  // use a minimal typing for transporter
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  (async () => {
    const nodemailer = await import('nodemailer');
    transporter = nodemailer.createTransport({ host: SMTP_HOST, port: SMTP_PORT, auth: { user: SMTP_USER, pass: SMTP_PASS }, secure: SMTP_PORT === 465 });
  })();
}

export async function sendEmail(to: string, subject: string, body: string) {
  if (transporter) {
    await transporter.sendMail({ from: MAIL_FROM, to, subject, text: body });
    return;
  }
  // Dev adapter: log to logger.
  log.info(`Sending email to ${to}: ${subject}\n${body}`);
}
