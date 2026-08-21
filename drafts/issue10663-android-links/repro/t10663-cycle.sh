#!/bin/bash
# Full cold-cache repro cycle: fresh fixture db + fresh server per run.
set -u
S=/tmp/claude-1000/-home-mhw-dev-mitn/a7a3d8bf-b9a3-4168-9650-fed422652500/scratchpad
W=/home/mhw/dev/mitn/.worktrees/trilium/issue10663-retest
D="$S/t10663-data"

stop_server() {
    local pid
    pid=$(ss -ltnp 2>/dev/null | grep -oP ':8391\s.*pid=\K[0-9]+' | head -1)
    if [ -n "${pid:-}" ]; then
        # kill the whole tsx/node pair via parent
        local ppid; ppid=$(ps -o ppid= -p "$pid" | tr -d ' ')
        kill "$pid" 2>/dev/null; [ -n "$ppid" ] && kill "$ppid" 2>/dev/null
        sleep 2
    fi
}

for i in 1 2; do
    echo "########## CYCLE $i ##########"
    stop_server
    rm -f "$D/document.db" "$D"/document.db-*
    cp -f "$W/packages/trilium-core/src/test/fixtures/document.db" "$D/document.db"
    ( cd "$W/apps/server" && NODE_ENV=development TRILIUM_ENV=dev TRILIUM_RESOURCE_DIR=src \
        TRILIUM_DATA_DIR="$D" ../../node_modules/.bin/tsx src/main.ts \
        >"$S/t10663-server-cycle$i.log" 2>&1 & )
    n=0
    until curl -sf http://127.0.0.1:8391/api/health-check >/dev/null 2>&1; do
        sleep 2; n=$((n+1)); [ "$n" -gt 60 ] && echo "CYCLE $i: server timeout" && continue 2
    done
    LD_LIBRARY_PATH="$S/libs/extracted/usr/lib/x86_64-linux-gnu" node "$S/t10663-repro.js" 2>&1 \
        | grep -E 'froca|picking index|VERDICT|FINAL TEXT|TOKEN|SCRIPT ERROR'
done
stop_server
echo "########## DONE ##########"
