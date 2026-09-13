import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, join, extname } from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp'};
export function createPublicServer() {
  return createServer(async(req,res)=>{
    const path=(req.url || '/').split('?')[0];
    const file=path==='/'?'index.html':['/s1','/s1/','/s1/index.html'].includes(path)?'s1/index.html':/^\/assets\/(?:member\/)?[a-z0-9-]+\.(js|css|svg|webp)$/.test(path)?path.slice(1):null;
    res.setHeader('Cache-Control','no-cache');
    res.setHeader('X-Content-Type-Options','nosniff');
    if (!file) {res.writeHead(404);return res.end('Not found.');}
    try {const data=await readFile(join(root,file));res.writeHead(200,{'Content-Type':types[extname(file)]});res.end(data);}
    catch {res.writeHead(404);res.end('Not found.');}
  });
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  createPublicServer().listen(Number(process.env.PORT || 8787),'127.0.0.1',()=>console.log('Member Hub: http://127.0.0.1:8787'));
}
