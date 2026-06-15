const { spawn } = require('child_process');

function start(name, cmd, args) {
  console.log(`Starting ${name}: ${cmd} ${args.join(' ')}`);
  const p = spawn(cmd, args, { stdio: 'inherit', shell: true });
  p.on('exit', (code) => {
    console.log(`${name} exited with code ${code}`);
    process.exit(code || 0);
  });
  p.on('error', (err) => {
    console.error(`${name} failed to start:`, err);
    process.exit(1);
  });
  return p;
}

const procs = [];
procs.push(start('metrics-server', 'npx', ['ts-node', 'src/server.ts']));
procs.push(start('pipeline', 'npx', ['ts-node', 'src/index.ts']));

function shutdown() {
  procs.forEach((p) => {
    try { p.kill('SIGINT'); } catch (e) {}
  });
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
