import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import log from '@/utils/logger';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * patch 조회
 * @param request 
 * @param params 
 * @returns 
 */
export async function GET() {
  try {
    log.info('API URL ::: GET /product/patch');
    const patchDir = path.join(process.cwd(), 'files/patch');
    const fileNames = await fs.readdir(patchDir);

    const files = await Promise.all(
      fileNames.map(async (fileName) => {
        const filePath = path.join(patchDir, fileName);
        const stats = await fs.stat(filePath);

        return {
          name: fileName,
          date: stats.mtime.toISOString(),
          size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
          path: filePath,
        };
      })
    );

    return new Response(JSON.stringify(files), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    log.info('API URL ::: GET /product/patch ERROR ::: '+error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch patch file list' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}