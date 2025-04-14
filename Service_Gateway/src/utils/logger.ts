import { createLogger, transports, format } from 'winston';
import fs from 'fs';
import path from 'path';

// 로그 경로 설정
// const logPath = '/var/log/ablecloud-crm';
// const logFile = path.join(logPath, 'app.log');

// /var/log/ablecloud-crm 폴더가 없으면 생성
// if (!fs.existsSync(logPath)) {
//   fs.mkdirSync(logPath, { recursive: true }); // 권한 필요
// }

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
    new transports.File({ filename: 'logs/app.log' })
  ]
});

export default logger;