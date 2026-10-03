// Dummy dashboard: collects a business's requirements and starts the Play Store
// workflow through the local `gh` login. Local only; no token reaches the page.
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { validate } = require('../scripts/dashboard-config');

const REPO = 'godavariwavetech/multivendor_delivery';
const WORKFLOW = 'build.yml';
const REF = 'deployment';
const PORT = 4747;
const GH = process.env.GH_PATH || `${process.env.ProgramFiles}\\GitHub CLI\\gh.exe`;

const gh = (args, stdin) =>
  new Promise((resolve, reject) => {
    const child = execFile(GH, args, { windowsHide: true }, (err, out, errOut) =>
      err ? reject(new Error(errOut || err.message)) : resolve(out),
    );
    if (stdin) child.stdin.end(stdin);
  });

const send = (res, code, body, type = 'application/json') => {
  res.writeHead(code, { 'Content-Type': type });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
};

const readBody = req =>
  new Promise(resolve => {
    let data = '';
    req.on('data', c => (data += c));
    req.on('end', () => resolve(data));
  });

const latestRunId = async () => {
  const runs = JSON.parse(await gh(['run', 'list', '-R', REPO, '-w', WORKFLOW, '-L', '1', '--json', 'databaseId']));
  return runs[0] && runs[0].databaseId;
};

http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://localhost:${PORT}`);
      if (req.method === 'GET' && url.pathname === '/') {
        return send(res, 200, fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'), 'text/html; charset=utf-8');
      }
      if (req.method === 'POST' && url.pathname === '/api/deploy') {
        const f = JSON.parse((await readBody(req)) || '{}');
        const problem = validate(f);
        if (problem) return send(res, 400, { error: problem });
        if (!f.businessName || !f.domain) return send(res, 400, { error: 'Business name and domain are required.' });
        const before = await latestRunId();
        const inputs = {
          deliver: 'apk', // the dashboard builds a downloadable APK; it never uploads to Play
          business_name: f.businessName || '',
          domain: f.domain || '',
          theme_color: f.themeColor || '',
          phone: f.phone || '',
          email: f.email || '',
          location: f.location || '',
          logo_base64: f.logo || '',
        };
        await gh(['workflow', 'run', WORKFLOW, '-R', REPO, '--ref', REF, '--json'], JSON.stringify(inputs));
        // dispatch returns no run id, so wait for the new run to appear
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 2000));
          const now = await latestRunId();
          if (now && now !== before) return send(res, 200, { runId: now });
        }
        return send(res, 504, { error: 'Workflow was dispatched but the run did not appear yet; check GitHub Actions.' });
      }
      if (req.method === 'GET' && url.pathname === '/api/status') {
        const id = url.searchParams.get('id') || '';
        if (!/^\d+$/.test(id)) return send(res, 400, { error: 'bad id' });
        const out = await gh(['api', `repos/${REPO}/actions/runs/${id}/jobs`, '--jq', '{jobs:[.jobs[]|{status,conclusion,steps:[.steps[]|{name,status,conclusion}]}]}']);
        return send(res, 200, out);
      }
      if (req.method === 'GET' && url.pathname === '/api/apk') {
        const id = url.searchParams.get('id') || '';
        if (!/^\d+$/.test(id)) return send(res, 400, { error: 'bad id' });
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'apk-'));
        try {
          await gh(['run', 'download', id, '-R', REPO, '-n', 'app-release-apk', '-D', dir]);
          const file = path.join(dir, 'app-release.apk');
          res.writeHead(200, {
            'Content-Type': 'application/vnd.android.package-archive',
            'Content-Length': fs.statSync(file).size,
            'Content-Disposition': `attachment; filename="app-${id}.apk"`,
          });
          return fs.createReadStream(file).on('close', () => fs.rmSync(dir, { recursive: true, force: true })).pipe(res);
        } catch (e) {
          fs.rmSync(dir, { recursive: true, force: true });
          throw e;
        }
      }
      send(res, 404, { error: 'not found' });
    } catch (e) {
      send(res, 500, { error: String(e.message || e).slice(0, 300) });
    }
  })
  .listen(PORT, '127.0.0.1', () => console.log(`Dummy dashboard: http://localhost:${PORT}`));
