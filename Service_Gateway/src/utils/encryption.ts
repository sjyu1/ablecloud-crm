import crypto from 'crypto';

/**
 * OpenSSL을 사용하여 blob 데이터를 암호화하는 함수
 */
export async function encryptBlob(data: Blob): Promise<string> {
  try {
    // Blob을 Buffer로 변환
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 암호화 키와 IV 생성 (환경 변수에서 가져오거나 안전하게 생성)
    const key = crypto.randomBytes(32); // 256 bit key
    const iv = crypto.randomBytes(16);  // 128 bit IV

    // 암호화
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(buffer);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // key, iv, encrypted data를 하나의 문자열로 합치기
    const result = Buffer.concat([
      key,
      iv,
      encrypted
    ]).toString('base64');

    return result;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('데이터 암호화에 실패했습니다.');
  }
} 