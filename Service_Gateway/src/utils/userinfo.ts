import { fetchWithAuth } from '@/utils/api';

export async function userinfo() {
  try {
    const res_user = await fetchWithAuth(`${process.env.KEYCLOAK_API_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/userinfo`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data_user = await res_user.json();

    // 1. client_credentials token 가져오기
    const submitData_token = {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      scope: process.env.SCOPE,
      grant_type: 'client_credentials',
    }

    const res_token = await fetch(`${process.env.KEYCLOAK_API_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(submitData_token).toString()
    });

    const client_token = await res_token.json();

    // 2. 사용자 정보 가져오기
    const res_user2 = await fetch(`${process.env.KEYCLOAK_API_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${data_user.sub}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${client_token.access_token}`,
      },
    });
    const data_userinfo = await res_user2.json();
    if (!data_userinfo) {
      return false
    }

    return data_userinfo
  } catch (error) {
    return false
  }
}