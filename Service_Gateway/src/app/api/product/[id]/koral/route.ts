import { NextResponse } from 'next/server';
import { fetchWithAuth } from '@/utils/api';
import log from '@/utils/logger';
import * as cheerio from 'cheerio';

/**
 * Koral 조회
 * @param request 
 * @param params 
 * @returns 
 */
export async function GET() {
  try {
    log.info('API URL ::: GET /product/koral');
    const res = await fetch(`${process.env.PRODUCT_URL}/koral`);
    const html = await res.text();
    const $ = cheerio.load(html);

    const files: {
      name: string;
      date: string;
      size: string;
      url: string;
    }[] = [];

    $('table tr').each((_, row) => {
      const cols = $(row).find('td');
      if (cols.length >= 4) {
        const anchor = $(cols[1]).find('a');
        // const name = anchor.text().trim();
        const href = anchor.attr('href') || '';
        const name = decodeURIComponent(href);
        const date = $(cols[2]).text().trim();
        const size = $(cols[3]).text().trim();

        // 상위 디렉토리 제외
        if (name !== '/' && href !== '../') {
          files.push({
            name,
            date,
            size,
            url: `https://product.ablecloud.io/koral/${href}`,
          });
        }
      }
    });

    return new Response(JSON.stringify(files), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    log.info('API URL ::: GET /product/koral ERROR ::: '+error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch Koral file list' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}