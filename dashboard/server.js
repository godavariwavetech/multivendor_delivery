// Dummy dashboard: collects build requirements and starts the Play Store
// workflow through the local `gh` login. Local only; no token reaches the page.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const REPO = 'godavariwavetech/multivendor_delivery';
const WORKFLOW = 'playstore-deploy.yml';
const REF = 'deployment';
const PORT = 4000;
const GH = process.env.GH_PATH || `${process.env.ProgramFiles}\\GitHub CLI\\gh.exe`;

const gh = args =>
  new Promise((resolve, reject) =>
    execFile(GH, args, { windowsHide: true }, (err, out, errOut) => (err ? reject(new Error(errOut || err.message)) : resolve(out))),
  );

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

// Values go straight into a build, so only accept plain, safe shapes.
function validate({ appName, apiBaseUrl }) {
  if (!/^[A-Za-z0-9][A-Za-z0-9 \-]{1,29}$/.test(appName || '')) {
    return 'App name: 2-30 letters, numbers, spaces or dashes.';
  }
  if (!/^https:\/\/[A-Za-z0-9.\-]+(:\d{2,5})?$/.test(apiBaseUrl || '')) {
    return 'API URL must be https://host or https://host:port (no path).';
  }
  return null;
}

http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://localhost:${PORT}`);
      if (req.method === 'GET' && url.pathname === '/') {
        return send(res, 200, fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'), 'text/html; charset=utf-8');
      }
      if (req.method === 'POST' && url.pathname === '/api/deploy') {
        const body = JSON.parse((await readBody(req)) || '{}');
        const problem = validate(body);
        if (problem) return send(res, 400, { error: problem });
        const before = JSON.parse(await gh(['run', 'list', '-R', REPO, '-w', WORKFLOW, '-L', '1', '--json', 'databaseId']));
        await gh([
          'workflow', 'run', WORKFLOW, '-R', REPO, '--ref', REF,
          '-f', 'track=internal', // the dummy dashboard can never reach Production
          '-f', `app_name=${body.appName}`,
          '-f', `api_base_url=${body.apiBaseUrl}`,
        ]);
        // dispatch returns no run id, so wait for the new run to appear
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 2000));
          const now = JSON.parse(await gh(['run', 'list', '-R', REPO, '-w', WORKFLOW, '-L', '1', '--json', 'databaseId']));
          if (now[0] && now[0].databaseId !== (before[0] && before[0].databaseId)) {
            return send(res, 200, { runId: now[0].databaseId });
          }
        }
        return send(res, 504, { error: 'Workflow was dispatched but the run did not appear yet; check GitHub Actions.' });
      }
      if (req.method === 'GET' && url.pathname === '/api/status') {
        const id = url.searchParams.get('id') || '';
        if (!/^\d+$/.test(id)) return send(res, 400, { error: 'bad id' });
        const out = await gh(['api', `repos/${REPO}/actions/runs/${id}/jobs`, '--jq', '{jobs:[.jobs[]|{status,conclusion,steps:[.steps[]|{name,status,conclusion}]}]}']);
        return send(res, 200, out);
      }
      send(res, 404, { error: 'not found' });
    } catch (e) {
      send(res, 500, { error: String(e.message || e).slice(0, 300) });
    }
  })
  .listen(PORT, '127.0.0.1', () => console.log(`Dummy dashboard: http://localhost:${PORT}`));
