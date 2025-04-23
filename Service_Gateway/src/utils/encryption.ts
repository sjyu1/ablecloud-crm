import crypto from 'crypto';

/**
 * OpenSSL을 사용하여 데이터를 암호화하는 함수
 */
export async function encryptContent(content: string): Promise<string> {
  try {
    // 암호화 키와 IV 생성
    // const key = crypto.randomBytes(32); // 256 bit key
    const key = crypto.scryptSync('password', 'salt', 32); // 256 bit key
    // const iv = crypto.randomBytes(16);  // 128 bit IV
    const iv = crypto.scryptSync('password', 'salt', 16);  // 128 bit IV
    
    // 암호화
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(content, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // key, iv, encrypted data를 하나의 문자열로 합치기
    // const result = Buffer.concat([
    //   key,
    //   iv,
    //   encrypted
    // ]).toString('base64');

    return encrypted.toString('base64');
  } catch (error) {
    // console.error('Encryption error:', error);
    throw new Error('라이센스 데이터 암호화에 실패했습니다.');
  }
} 

/**
 * OpenSSL을 사용하여 데이터를 복호화하는 함수
 */
export async function decryptContent(encryptedContent: string): Promise<string> {
  try {
    // base64 디코딩
    const buffer = Buffer.from(encryptedContent, 'base64');
    
    // key, iv, data 분리
    // const key = buffer.subarray(0, 32);
    // const iv = buffer.subarray(32, 48);
    // const encrypted = buffer.subarray(48);
    const key = crypto.scryptSync('password', 'salt', 32); // 256 bit key
    const iv = crypto.scryptSync('password', 'salt', 16);  // 128 bit IV

    // 복호화
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(buffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  } catch (error) {
    // console.error('Decryption error:', error);
    throw new Error('라이센스 데이터 복호화에 실패했습니다.');
  }
} 