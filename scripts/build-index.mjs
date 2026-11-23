import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const packagesDir = path.join(root, 'packages')
const distDir = path.join(root, 'dist')
const checkOnly = process.argv.includes('--check')

const SEMVER_RE = /^\d+\.\d+\.\d+$/
const NAME_RE = /^[a-z][a-z0-9-]*$/
const SHA256_RE = /^[a-f0-9]{64}$/i

function fail(msg) {
  console.error(`ERROR: ${msg}`)
  process.exit(1)
}

if (!fs.existsSync(packagesDir)) {
  fail('packages/ directory not found')
}

const files = fs
  .readdirSync(packagesDir)
  .filter((f) => f.endsWith('.json'))
  .sort()

const packages = []

for (const file of files) {
  const fullPath = path.join(packagesDir, file)
  let pkg
  try {
    pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'))
  } catch (err) {
    fail(`${file}: invalid JSON (${err.message})`)
  }

  const expectedName = file.slice(0, -'.json'.length)
  if (typeof pkg.name !== 'string' || !NAME_RE.test(pkg.name)) {
    fail(`${file}: invalid package name "${pkg.name}" (must match ${NAME_RE})`)
  }
  if (pkg.name !== expectedName) {
    fail(`${file}: package name "${pkg.name}" does not match filename "${expectedName}.json"`)
  }
  if (typeof pkg.description !== 'string' || pkg.description.trim() === '') {
    fail(`${file}: missing description`)
  }
  if (typeof pkg.author !== 'string' || pkg.author.trim() === '') {
    fail(`${file}: missing author`)
  }
  if (typeof pkg.license !== 'string' || pkg.license.trim() === '') {
    fail(`${file}: missing license`)
  }
  if (!pkg.versions || typeof pkg.versions !== 'object' || Object.keys(pkg.versions).length === 0) {
    fail(`${file}: must define at least one version`)
  }
  if (typeof pkg.latest !== 'string' || !pkg.versions[pkg.latest]) {
    fail(`${file}: latest "${pkg.latest}" must exist in versions`)
  }

  for (const [ver, rel] of Object.entries(pkg.versions)) {
    if (!SEMVER_RE.test(ver)) {
      fail(`${file}: invalid version "${ver}" (expected X.Y.Z)`)
    }
    if (typeof rel.tarball !== 'string' || !rel.tarball.startsWith('https://')) {
      fail(`${file}@${ver}: tarball must be an https:// URL`)
    }
    if (rel.sha256 && !SHA256_RE.test(rel.sha256)) {
      fail(`${file}@${ver}: sha256 must be a 64-character hex string`)
    }
  }

  packages.push({
    name: pkg.name,
    description: pkg.description.trim(),
    author: pkg.author.trim(),
    license: pkg.license.trim(),
    repository: pkg.repository || '',
    tags: Array.isArray(pkg.tags) ? pkg.tags : [],
    latest: pkg.latest,
    versions: pkg.versions,
  })
}

console.log(`Validated ${packages.length} package(s).`)

if (checkOnly) {
  process.exit(0)
}

fs.mkdirSync(distDir, { recursive: true })

const index = {
  version: 1,
  updated_at: new Date().toISOString(),
  packages,
}

fs.writeFileSync(path.join(distDir, 'index.json'), JSON.stringify(index, null, 2) + '\n', 'utf8')
fs.writeFileSync(path.join(distDir, '.nojekyll'), '', 'utf8')
fs.writeFileSync(
  path.join(distDir, 'index.html'),
  `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>fkspm-index</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #202331; color: #f0eeff; padding: 40px; max-width: 680px; margin: 0 auto; }
    a { color: #ffaff3; }
    code { background: #2f3448; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>fkspm-index</h1>
  <p>Static Git-backed package index for <strong>FakeScript</strong> (<code>fkspm</code>).</p>
  <ul>
    <li><a href="./index.json">index.json</a> (${packages.length} package${packages.length === 1 ? '' : 's'})</li>
    <li><a href="https://github.com/ChaiMaii/fkspm">fkspm CLI</a></li>
    <li><a href="https://github.com/ChaiMaii/fkspm-index">Submit a package via PR</a></li>
  </ul>
</body>
</html>
`,
  'utf8'
)

console.log(`Wrote dist/index.json (${packages.length} package(s)).`)
