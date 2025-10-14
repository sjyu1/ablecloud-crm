import { NextResponse } from 'next/server';
import { userinfo, userinfo_id } from '@/utils/userinfo';
import log from '@/utils/logger';

/**
 * 로그인
 * @param request 
 * @returns 
 */ 
export async function POST(request: Request) {
  try {
    log.info('API URL ::: POST /api/login');
    const body = await request.json();
    const { username, password } = body;
    const submitData = {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: process.env.GRANT_TYPE,
      scope: process.env.SCOPE,
      username,
      password
    }

    const res = await fetch(`${process.env.KEYCLOAK_API_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(submitData).toString()
    });

    const data = await res.json();
    log.info('login username ::: '+username);
    // log.info('POST /api/login DATA ::: '+JSON.stringify(data));

    /*
    {
      "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJRMnZXZ3llWVN1X1ZFVHBlNlptdkQtY00xUkJNMDhaRnRUdmNySW82U3Q4In0.eyJleHAiOjE3MzU1MzU3OTIsImlhdCI6MTczNTUzNTczMiwianRpIjoiNTIyYTgzNzQtMjZjYS00NjMwLWI1YjMtM2FlM2RjODEyN2M1IiwiaXNzIjoiaHR0cDovLzEwLjEwLjI1NC4yMDg6ODA4MC9yZWFsbXMvdGVzdCIsImF1ZCI6ImFjY291bnQiLCJzdWIiOiI2ZGI3YzRkYS03YWY5LTRmYzQtODg1My03YWIwMjUzNWI1OGYiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJ0ZXN0LWNsaWVudCIsInNpZCI6IjIyYmZhMTI2LTM1NGItNGQyZC1iMDk5LWUwN2Q3YjAwMWJiZiIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiaHR0cDovLzEwLjEwLjI1NC4yMDg6MzAwMCJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiZGVmYXVsdC1yb2xlcy10ZXN0Iiwib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIm5hbWUiOiJ1c2VyMDEgdXNlcjAxIiwicHJlZmVycmVkX3VzZXJuYW1lIjoidXNlcjAxIiwiZ2l2ZW5fbmFtZSI6InVzZXIwMSIsImZhbWlseV9uYW1lIjoidXNlcjAxIiwiZW1haWwiOiJ1c2VyMDFAdXNlci5jb20ifQ.j0hWXGpxm-JBhyB4YTFU-czNpmwro5dUGqeOuzLogse-_xBDtAARsvhMaL3aGN0IyLMeAu6e-eNUkqKYkw05M9KYT2NmO1gJ7gc8C1iejNnT_qwYZt8aYJqnd7kAlTDTNXxCFLKCKrZ-iOorA7mAHiEreULAr-KAp0vRiJ3XQtHzoFV7KgJOaDRAootMccwMAwZxDMYZ7f-mbl4x5SvkplDQroob5SN5r_m8NpsEdxmnCr9YO705-OypEHBbJga7sHrnqkcxG-LzTAbSPTj0al3Vnr1-T4ha9NzP5Xj_wefHtqYEmkrLingLiW7lngzJ4mZuSTVSqhllvM3_MGU0yA",
      "expires_in": 60,
      "refresh_expires_in": 1800,
      "refresh_token": "eyJhbGciOiJIUzUxMiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI4ZTE0OWRiYi0wNGU1LTRmNzctOWQ5Ny05ZjJkZTBmZjAwYWEifQ.eyJleHAiOjE3MzU1Mzc1MzIsImlhdCI6MTczNTUzNTczMiwianRpIjoiODY4YWFkZDMtNGM2Yy00M2I4LWI3ZDQtZjVlZmMzNWI3N2UyIiwiaXNzIjoiaHR0cDovLzEwLjEwLjI1NC4yMDg6ODA4MC9yZWFsbXMvdGVzdCIsImF1ZCI6Imh0dHA6Ly8xMC4xMC4yNTQuMjA4OjgwODAvcmVhbG1zL3Rlc3QiLCJzdWIiOiI2ZGI3YzRkYS03YWY5LTRmYzQtODg1My03YWIwMjUzNWI1OGYiLCJ0eXAiOiJSZWZyZXNoIiwiYXpwIjoidGVzdC1jbGllbnQiLCJzaWQiOiIyMmJmYTEyNi0zNTRiLTRkMmQtYjA5OS1lMDdkN2IwMDFiYmYiLCJzY29wZSI6Im9wZW5pZCB3ZWItb3JpZ2lucyBwcm9maWxlIGFjciByb2xlcyBiYXNpYyBlbWFpbCJ9.Ei3LqY_0YP2P7YLHW2cPXTXFY85b2d_l030_FDybjema5ko_t30EWEmPO1mNvgCDHhZ_w9EcUGuno7r2cEZZbw",
      "token_type": "Bearer",
      "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJRMnZXZ3llWVN1X1ZFVHBlNlptdkQtY00xUkJNMDhaRnRUdmNySW82U3Q4In0.eyJleHAiOjE3MzU1MzU3OTIsImlhdCI6MTczNTUzNTczMiwianRpIjoiMTI5Y2RmMWYtNWMyYi00NDA5LWIyM2MtMjRlMTA2YmM3MjA2IiwiaXNzIjoiaHR0cDovLzEwLjEwLjI1NC4yMDg6ODA4MC9yZWFsbXMvdGVzdCIsImF1ZCI6InRlc3QtY2xpZW50Iiwic3ViIjoiNmRiN2M0ZGEtN2FmOS00ZmM0LTg4NTMtN2FiMDI1MzViNThmIiwidHlwIjoiSUQiLCJhenAiOiJ0ZXN0LWNsaWVudCIsInNpZCI6IjIyYmZhMTI2LTM1NGItNGQyZC1iMDk5LWUwN2Q3YjAwMWJiZiIsImF0X2hhc2giOiI4SktwSkhkMDhtcFdCck5vSzVaUi1RIiwiYWNyIjoiMSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwibmFtZSI6InVzZXIwMSB1c2VyMDEiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJ1c2VyMDEiLCJnaXZlbl9uYW1lIjoidXNlcjAxIiwiZmFtaWx5X25hbWUiOiJ1c2VyMDEiLCJlbWFpbCI6InVzZXIwMUB1c2VyLmNvbSJ9.hnmUhy2Nv7wJJZvkI01VJuzLdrdMkbtDEV-UT1wMBJFHgSKw575uIOyFAjlqRp3wi_s8Cxo8FVZUwkx1-SBY5UuJCwHdcmQQMGHAXZcp7tOhREe7KFYzShQFN1rZiCD5v20ONwfuSC965NlGhmAjr1SayROH3DDpy8knZcv9fYCt4yqDL_uRei1yGWxd1TwqXe8CIYJMdgyrF22DVstVb50kquparbgZ4r8nWe3LV-RvJJElScMmy0qWRYcc8wWaKjrTbFTW6N-OJ4h4IT8CPOkGJYmCH9MXLmnFbsBuCUhjXm8ntPwGWQEvAucVEVcFnjdBsiaM64P6JsSQ_ERqEw",
      "not-before-policy": 0,
      "session_state": "22bfa126-354b-4d2d-b099-e07d7b001bbf",
      "scope": "openid profile email"
    }
    */

    if (data.error) {
      throw new Error(data.error);
    }

    // 사용자 company id 조회
    const res_user = await fetch(`${process.env.KEYCLOAK_API_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/userinfo`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.access_token}`,
      },
    });

    const data_user = await res_user.json();

    let company_id = '';
    const data_userinfo = await userinfo_id(data_user.sub);
    if (!data_userinfo.error && data_userinfo.attributes.type[0] == 'partner') {
      company_id = data_userinfo.attributes.company_id[0]
    }

    return NextResponse.json({
      status: 200,
      token: data.access_token,
      user: {
        username: username,
        user_id: data_user.sub,
        company_id: company_id
      } 
    });
  } catch (error) {
    log.info('POST /api/login ERROR ::: '+error);
    // console.error('Login error:', error);
    return NextResponse.json(
      { message: '아이디 또는 비밀번호가 올바르지 않습니다.' },
      { status: 401 }
    );
  }
}