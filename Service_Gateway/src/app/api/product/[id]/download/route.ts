import { NextResponse } from 'next/server';
import { validToken } from '@/utils/api';
import log from '@/utils/logger';
import path from 'path';
import fs from 'fs';
import { cookies } from 'next/headers';


/**
 * 제품 다운로드
 * @param request 
 * @param params 
 * @returns 
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    log.info('API URL ::: GET /product/download');
    const { searchParams } = new URL(request.url);
    const filePathUrl = searchParams.get('filePath');
    const cookieStore = cookies();
    const token = (await cookieStore).get('token')?.value;
    if (!token) {
      throw new Error('인증 토큰이 없습니다.');
    }

    // 토큰인증
    const user = await validToken(token || '');
    if (!user) {
      throw new Error('인증되지 않은 사용자입니다.');
    }
    
    if (!filePathUrl) {
      throw new Error('해당 파일이 존재하지 않습니다.');
    }
  
    const filePath = path.join(process.cwd(), 'files', filePathUrl);
  
    try {
      await fs.promises.access(filePath, fs.constants.R_OK);
      const stat = await fs.promises.stat(filePath);
      const fileSize = stat.size;

      const stream = fs.createReadStream(filePath);

      return new Response(stream as any, {
        status: 200,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(path.basename(filePathUrl))}"`,
          'Content-Length': fileSize.toString(),
        },
      });
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        throw new Error('파일을 찾을 수 없습니다.');
      } else if (err.code === 'EACCES') {
        throw new Error('파일 접근 권한이 없습니다.');
      }
      throw new Error('서버 오류가 발생했습니다.');
    }
  } catch (error) {
    log.info('GET /product/'+params.id+' ERROR ::: '+error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { message: errorMessage || '제품 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
