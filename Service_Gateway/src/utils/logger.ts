import { createLogger, transports, format } from 'winston';
import path from 'path';
import fs from 'fs';

const logPath = '/var/log';
const logFile = path.join(logPath, 'lic.log');

if (!fs.existsSync(logPath)) {
  fs.mkdirSync(logPath, { recursive: true });
}

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: logFile })
  ]
});

export default logger;
