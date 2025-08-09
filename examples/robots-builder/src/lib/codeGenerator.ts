export type GeneratedFile = { path: string; content: string };
export type GeneratedCode = { files: GeneratedFile[]; installCommands: string[]; integrationCode: string };

export async function generatePlatformCode(apiBase: string, platform: 'express' | 'cloudflare' | 'nginx' | 'wordpress', builderConfig: any): Promise<GeneratedCode> {
  const base = apiBase || (typeof window !== 'undefined' ? (window as any).__A4A_API_BASE__ : 'http://localhost:4005');
  const res = await fetch(`${base}/policies/generate-code`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ platform, builderConfig })
  });
  if (!res.ok) throw new Error(`Code generation failed: ${res.status}`);
  return res.json();
}
