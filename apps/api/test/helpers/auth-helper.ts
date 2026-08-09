import request from 'supertest';
import { INestApplication } from '@nestjs/common';

export async function loginAsAdmin(app: INestApplication, subdomain: string, email: string, password: string, rootDomain: string) {
  const loginRes = await request(app.getHttpServer())
    .post('/api/auth/login')
    .set('Host', rootDomain)
    .send({ email, password });
    
  const redeemRes = await request(app.getHttpServer())
    .get(`/api/auth/handoff?code=${loginRes.body.handoff_token}`)
    .set('Host', `${subdomain}.${rootDomain}`);
    
  const cookie = (redeemRes.headers['set-cookie'] || [])[0] || '';
  console.log(`loginAsAdmin[${email}]: loginStatus=${loginRes.status}, redeemStatus=${redeemRes.status}, cookieLength=${cookie.length}`);
  return cookie.split(';')[0].replace('umrolink_token=', '');
}
