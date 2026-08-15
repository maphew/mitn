Independently rebuilt this branch (head 0f03031c2f) and tested a combination
not covered by CI or the PR description: arm64 + musl (Alpine), via
`docker buildx build --platform linux/arm64 -f Dockerfile.alpine`.

Context: `Check Docker build` in dev.yml runs on `ubuntu-latest`, so it only
covers x64 for both Dockerfile and Dockerfile.alpine. The `linux-arm64`
Playwright job uses a native arm64 runner but runs the server directly with
node, not through Docker. `main-docker.yml`, which does build/push the
multi-arch images, only triggers on push to main, tags, or manual dispatch, never on PRs. So arm64 in a
Docker container (either libc) had no pre-merge coverage before this.

Built and ran arm64 Alpine under QEMU (no native arm64 hardware here):

```
docker buildx build --platform linux/arm64 -f Dockerfile.alpine \
  -t triliumnext-alpine-arm64 --load .
```

Build succeeded on the first try. Then:

```
docker run --rm --platform linux/arm64 triliumnext-alpine-arm64 \
  node -e "require('better-sqlite3')(':memory:')"
```

loads and opens fine (`linuxmusl-arm64.node`, better-sqlite3 13.0.2). Ran
the actual container (not just node -e) and let the built-in HEALTHCHECK
run to completion: reached `healthy`, `GET /api/health-check` returned 200.

Not tested: arm64 + glibc (Dockerfile/Debian) in Docker specifically, and
no real arm64 hardware (QEMU emulation only, so timing/syscall-dependent
bugs like the musl pwritev2 issue this Dockerfile already works around
could still differ on real silicon).

Full commands and log: internal notes, available on request.

_claude-fable-5-high on behalf of matt wilkie_
