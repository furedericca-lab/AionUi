# AionUi WebUI-only Justfile
set shell := ["bash", "-lc"]

default:
    @just --list

install:
    bun install

build-renderer:
    bun run build:renderer:web

build-server:
    bun run build:server

build:
    bun run build

start:
    bun run start

start-prod:
    bun run start:prod

resetpass USERNAME='':
    if [ -n "{{USERNAME}}" ]; then NODE_ENV=production bun dist-server/server.mjs --resetpass "{{USERNAME}}"; else bun run resetpass; fi

lint:
    bun run lint

format:
    bun run format

test:
    bun run test

typecheck:
    bunx tsc --noEmit

i18n:
    bun run i18n:types && node scripts/check-i18n.js
