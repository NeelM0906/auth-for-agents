import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { generateKeyPair, exportJWK, JWK } from 'jose';

export type IssuerKeys = { privateJwk: JWK; publicJwks: { keys: JWK[] }; issuer: string };

export async function ensureIssuerKeys(baseDir: string, issuer = 'http://localhost:3000'): Promise<IssuerKeys> {
  const privPath = join(baseDir, 'issuer.private.jwk.json');
  const pubPath = join(baseDir, 'issuer.jwks.json');
  await fs.mkdir(baseDir, { recursive: true });
  try {
    const [privRaw, pubRaw] = await Promise.all([fs.readFile(privPath, 'utf8'), fs.readFile(pubPath, 'utf8')]);
    return { privateJwk: JSON.parse(privRaw), publicJwks: JSON.parse(pubRaw), issuer };
  } catch {
    const { publicKey, privateKey } = await generateKeyPair('EdDSA', { crv: 'Ed25519' });
    const pubJwk = await exportJWK(publicKey);
    const privJwk = await exportJWK(privateKey);
    const kid = 'demo-' + Math.random().toString(36).slice(2, 10);
    (pubJwk as any).kid = kid;
    (privJwk as any).kid = kid;
    const publicJwks = { keys: [pubJwk as JWK] };
    await Promise.all([
      fs.writeFile(privPath, JSON.stringify(privJwk, null, 2)),
      fs.writeFile(pubPath, JSON.stringify(publicJwks, null, 2))
    ]);
    return { privateJwk: privJwk as JWK, publicJwks, issuer };
  }
}


