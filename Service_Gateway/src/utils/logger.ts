import { createLogger, transports, format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// 로그 경로 설정
// const logPath = '/var/log/ablecloud-crm';
const logPath = 'logs/';
const logFile = path.join(logPath, 'app.log');

// // /var/log/ablecloud-crm 폴더가 없으면 생성
// if (!fs.existsSync(logPath)) {
//   fs.mkdirSync(logPath, { recursive: true }); // 권한 필요
// }

// 날짜별 로그 파일 생성
const dailyRotateFileTransport = new DailyRotateFile({
  dirname: logPath,
  filename: 'app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '7d'
});

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
    dailyRotateFileTransport
  ]
});

export default logger;