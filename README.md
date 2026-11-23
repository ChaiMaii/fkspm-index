# fkspm-index

The official Git-backed package registry index for **FakeScript (`fkspm`)**.

Every push to `main` validates all manifests in `packages/` and publishes the compiled index to GitHub Pages:

**https://chaimaii.github.io/fkspm-index/index.json**

## Submitting a Package

1. Tag a release in your package's GitHub repository (e.g. `v1.0.0`).
2. Add `packages/<your-package-name>.json`:

```json
{
  "name": "mypkg",
  "description": "Short summary of your FakeScript package",
  "author": "YourGitHubUsername",
  "license": "WTFPL",
  "repository": "https://github.com/YourGitHubUsername/fks-mypkg",
  "tags": ["cli", "utils"],
  "latest": "1.0.0",
  "versions": {
    "1.0.0": {
      "tarball": "https://github.com/YourGitHubUsername/fks-mypkg/archive/refs/tags/v1.0.0.tar.gz",
      "sha256": "<optional-64-char-hex-sha256>",
      "dependencies": {}
    }
  }
}
```

3. Validate locally:

```bash
node scripts/build-index.mjs --check
```

4. Open a Pull Request — GitHub Actions validates your package automatically and updates `index.json` upon merge.

## License

Licensed under the [WTFPL](./LICENSE).
