# PR 10825 validation notes: native SQLite Docker artifacts

Bead: mitn-5kv.7 (P2). Slug: pr10825-docker-native-sqlite.

PR: https://github.com/TriliumNext/Trilium/pull/10825
"fix(build): preserve native SQLite artifacts for Docker architectures"
Author: iansherr. Base: main. Head: agent/plugin-build.
Head commit fetched: `0f03031c2f` (fix(build): handle encoded verifier paths).

## What the PR does

- `apps/server/scripts/build.ts`: calls
  `build.trimBetterSqlite3({ includeAllLinuxArchitectures: true })` instead of
  the default host-only trim, so the server build artifact retains all four
  Linux `better-sqlite3` N-API prebuilds needed by the Docker images:
  `linux-x64.node`, `linux-arm64.node`, `linuxmusl-x64.node`,
  `linuxmusl-arm64.node`.
- `scripts/build-utils.ts`: adds the `includeAllLinuxArchitectures` option to
  `trimBetterSqlite3`, additive and off by default, so other build targets
  (Electron, other platforms) are unaffected.
- `apps/server/scripts/verify-build-artifacts.mjs` (new): asserts all four
  prebuilds exist under `dist/node_modules/better-sqlite3/prebuilds/` before
  packaging; wired into `apps/server/package.json`'s `package` script via a
  new `verify-build-artifacts` step.
- `apps/server/spec/build-checks/artifacts.spec.ts`: adds an explicit test
  asserting the four prebuilds are present, and drops
  `bindings`/`file-uri-to-path` from the required-paths list (no longer
  produced/needed for the N-API build).
- `apps/server/vitest.build.config.mts`: build-artifact tests no longer load
  the general server `spec/setup.ts`.

Diff is small, mechanical, and additive. Read via `gh pr diff 10825` (145
lines) and confirmed against `git show pr/10825:<path>` for each touched
file.

## What was actually tested (per PR body + CI), vs what was not

PR body's stated validation:

```
pnpm --filter=server test-build
pnpm --filter=server verify-build-artifacts
pnpm --filter=server docker-build-debian
pnpm --filter=server docker-build-alpine
Debian container health check passed
Alpine container health check passed
```

`docker-build-debian` / `docker-build-alpine` (from
`apps/server/package.json`, confirmed at `pr/10825`) run plain
`docker build . -f Dockerfile[.alpine]` -- single-platform, host-arch only,
no `--platform` flag. The PR body does not state the author's host
architecture. No arm64-specific note appears anywhere in the PR
description or the (bot-only; no human review comments present) PR
discussion.

CI (`gh pr checks 10825`), all passing:

- `Check Docker build (Dockerfile)` / `Check Docker build (Dockerfile.alpine)`
  -- from `.github/workflows/dev.yml`, `runs-on: ubuntu-latest`. GitHub-hosted
  `ubuntu-latest` is x64 only. Confirmed by reading the workflow file at
  `pr/10825`. So this exercises **x64 glibc (Debian)** and **x64 musl
  (Alpine)** Docker builds only.
- `E2E tests on linux-arm64` / `Standalone E2E tests on linux-arm64` -- from
  `.github/workflows/playwright.yml`, matrix `os: ubuntu-24.04-arm` (a
  *native* GitHub-hosted arm64 runner, not QEMU -- confirmed by reading the
  matrix). These build the server with `pnpm build` and run it directly with
  node, **not through Docker**, and do not select Alpine/musl. So this
  exercises **arm64 glibc, non-Docker** only.
- `.github/workflows/main-docker.yml` (the workflow that actually builds and
  pushes the multi-arch images via buildx) triggers only on `push` to `main`
  or `workflow_dispatch` -- it does not run as a PR check at all, so it
  provides zero pre-merge signal for this PR.

Net: **no CI job and no confirmed author action ever built or ran a Docker
image for arm64** (neither Debian/glibc nor Alpine/musl) before merge. The
two combinations that this PR exists to protect -- arm64 in a Docker
container -- are the untested gap. This is the gap I targeted.

## Local environment / feasibility

```
$ uname -m
x86_64
$ docker info | head -3
Client: Docker Engine - Community
 Version:    29.7.2
$ docker buildx ls
NAME/NODE     DRIVER/ENDPOINT   STATUS    BUILDKIT   PLATFORMS
default*      docker                                 
 \_ default    \_ default       running   v0.32.2    linux/amd64 (+4), linux/arm64, linux/arm (+2), linux/ppc64le, (7 more)
$ ls /proc/sys/fs/binfmt_misc/ | grep aarch64
qemu-aarch64
qemu-aarch64_be
```

Host is x64 (native x64 already covered by CI, see above). QEMU aarch64
emulation is registered and buildx reports `linux/arm64` support, so an
arm64 build/run is feasible here via QEMU emulation (not native hardware).
Per task guidance (native-arch first, otherwise QEMU arm64) -- x64
musl/Alpine is already covered by CI's `Check Docker build (Dockerfile.alpine)`
job, so there was no untested native-arch combination left to prefer over
QEMU arm64. I built and ran **arm64 + musl (Alpine)**, the combination with
the least existing coverage and the more failure-prone libc pairing for
native modules.

## Build and run

Worktree (read-only checkout, never committed to):
`git -C $trilium_root worktree add --detach $mitn_root/.worktrees/trilium/pr10825 pr/10825`
-> `$mitn_root/.worktrees/trilium/pr10825` at `0f03031c2f`.

```
$ cd $mitn_root/.worktrees/trilium/pr10825
$ pnpm install --frozen-lockfile          # ~41s, log: pnpm-install.log
$ cd apps/server
$ pnpm build                              # log: build-server.log
$ find dist/node_modules/better-sqlite3/prebuilds -type f
dist/node_modules/better-sqlite3/prebuilds/linux-arm64.node
dist/node_modules/better-sqlite3/prebuilds/linux-x64.node
dist/node_modules/better-sqlite3/prebuilds/linuxmusl-arm64.node
dist/node_modules/better-sqlite3/prebuilds/linuxmusl-x64.node
$ node scripts/verify-build-artifacts.mjs
Verified 4 Docker native artifacts in .../dist/
```

All four prebuilds present as the PR intends; verifier script passes.

```
$ docker buildx build --platform linux/arm64 -f Dockerfile.alpine \
    -t triliumnext-alpine-arm64 --load .
...
#11 writing image sha256:4516ef5bb99c62d92553b5dbe2c312c9360f2e2c853c84cd29e28b39f20fb9f0 done
#11 naming to docker.io/library/triliumnext-alpine-arm64 done
```

Full transcript: `build.log`. Build succeeded on the first attempt, no
errors.

```
$ docker image inspect triliumnext-alpine-arm64 --format '{{.Architecture}} {{.Os}}'
arm64 linux

$ docker run --rm --platform linux/arm64 triliumnext-alpine-arm64 \
    node -e "const db=require('better-sqlite3')(':memory:'); \
             console.log('sqlite ok, version:', db.pragma('user_version', {simple:true})); \
             console.log(require('better-sqlite3/package.json').version);"
sqlite ok, version: 0
13.0.2
```

`better-sqlite3` (v13.0.2, N-API/musl-arm64 prebuild) loads and opens a
database inside the emulated arm64 Alpine container -- direct confirmation
that `linuxmusl-arm64.node` is the correct, working binary for this image.

Then ran the actual container entrypoint (not just node -e) and let the
built-in `HEALTHCHECK` (`docker_healthcheck.cjs`) run:

```
$ docker run -d --platform linux/arm64 --name pr10825-arm64-test \
    -p 18081:8080 triliumnext-alpine-arm64
$ docker logs pr10825-arm64-test
...
📦 Versions:    app=0.104.1 db=240 sync=39 clipper=1.0
App HTTP server starting up at port 8080
Listening on port 8080
...
Slow 200 GET /api/health-check with 15 bytes took 38ms
$ docker inspect --format='{{.State.Health.Status}}' pr10825-arm64-test
healthy
$ docker inspect --format='{{json .State.Health}}' pr10825-arm64-test
{
  "Status": "healthy",
  "Log": [
    {"ExitCode": 1, "Output": "ERROR\n"},          # first probe, app still starting
    {"ExitCode": 0, "Output": "STATUS: 200\n"}      # second probe, healthy
  ]
}
```

Container reached `healthy` on the second health-check probe (expected --
`HEALTHCHECK --start-period=10s`, first probe race with startup is normal).
Server started, listened on 8080, and served a 200 on `/api/health-check`,
all under QEMU aarch64 emulation. Stopped and removed the container
afterward; kept the image (`triliumnext-alpine-arm64:latest`,
`sha256:4516ef5bb99c62d92553b5dbe2c312c9360f2e2c853c84cd29e28b39f20fb9f0`,
351MB) per task instructions.

## Verified vs inferred

Verified directly, this session:
- Diff content and file list (`gh pr diff`, `git show pr/10825:<path>`).
- CI job list and pass/fail (`gh pr checks 10825`).
- CI workflow runner architecture for each relevant job, by reading the
  workflow YAML at the PR head ref.
- `main-docker.yml`'s trigger conditions (push/dispatch only, not PR).
- Local QEMU/buildx feasibility (`docker buildx ls`, `binfmt_misc`).
- Build of the PR branch, presence of all 4 SQLite prebuilds, verifier
  script pass.
- arm64 + musl (Alpine) Docker image build success under QEMU.
- `better-sqlite3` load and basic query inside that image.
- Full container startup + built-in HTTP health check reaching `healthy`
  inside that image.

Inferred / not directly verified:
- The author's own host architecture for their manual
  `docker-build-debian`/`docker-build-alpine` runs -- not stated in the PR.
  Inferred as "probably x64" only because no arm64-specific detail is
  mentioned and CI's own Docker-build coverage is x64-only; this is an
  inference, not a confirmed fact.
- arm64 + **glibc** (Dockerfile, Debian/trixie) was not built this session --
  time was spent on the higher-value musl gap instead. Debian/glibc arm64 is
  a smaller risk given the arm64 glibc prebuild is already exercised
  natively (non-Docker) by the `linux-arm64` E2E CI job, but the Docker
  container-specific path (base image, `apt`-installed `gosu`, entrypoint
  script) is still nominally unverified for that specific combination.
- No real (non-QEMU) arm64 hardware was used; QEMU emulation can mask or
  introduce different behavior than real silicon in rare cases (e.g. timing,
  syscall edge cases). The `pwritev2`/musl 1.2.6 issue documented in
  `Dockerfile.alpine`'s own comments (TriliumNext/Trilium#10627) is exactly
  this kind of host-syscall-dependent bug, so a QEMU pass is good evidence
  but not a substitute for a real arm64 host test.
- Data persistence, restart, and actual note-taking write/read cycles beyond
  the health-check endpoint were not exercised.

## Bottom line

The PR's mechanism is sound and does what it claims: it keeps all four
Linux `better-sqlite3` prebuilds in the server artifact and fails the build
early (via the new verifier) if any are missing. That part is well tested
by CI for x64 (both libcs) and by the new build-check spec.

The gap is that arm64-in-Docker (the actual multi-arch image consumers this
PR is meant to serve) had no pre-merge CI coverage and no explicitly stated
author test, for either libc. This session closed part of that gap: arm64
Alpine/musl, the more fragile libc pairing, was built and run successfully
under QEMU emulation, including reaching the container's own health check.
arm64 Debian/glibc remains the one combination in the 2x2 matrix nobody
(author, CI, or this session) has demonstrably built as a Docker image
before merge.
