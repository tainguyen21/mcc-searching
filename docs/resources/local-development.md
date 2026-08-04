# Local Development

Windows with WSL 2 support is the primary path for this repository. Install the tools below in order, then run the checkpoints exactly as written from the repository root.

## Official Install References

- [Node.js downloads](https://nodejs.org/en/download)
- [pnpm installation](https://pnpm.io/installation)
- [Python on Windows](https://docs.python.org/3/using/windows.html)
- [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/)

If you are setting up on another platform, use the matching official pages before continuing:

- [Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/)
- [Docker Desktop for Linux](https://docs.docker.com/desktop/setup/install/linux/)
- [Python on macOS](https://docs.python.org/3/using/mac.html)
- [Python on Unix platforms](https://docs.python.org/3/using/unix.html)

## Prerequisites

1. Install Node.js from the official downloads page.
2. Install pnpm through Corepack.
3. Install Python 3.12 on Windows and ensure the launcher is available.
4. Install Docker Desktop with WSL 2 enabled.

## First-Run Checkpoints

Run these commands from a fresh PowerShell session after the installs above:

```powershell
node --version
npm install --global corepack@latest
corepack enable pnpm
corepack install
pnpm --version
py -3.12 --version
docker version
docker compose version
pnpm install
docker compose up -d db
docker compose exec db pg_isready -U mcc -d mcc
```

Expected checkpoints:

- `node --version` prints the installed Node.js version.
- `pnpm --version` prints the Corepack-managed pnpm version.
- `py -3.12 --version` confirms Python 3.12 is available.
- `docker version` and `docker compose version` confirm Docker Desktop is running.
- `pnpm install` installs the workspace dependencies.
- `pg_isready` reports that the local `mcc` database is accepting connections.

## Task 1 Verification Note

The project prerequisite remains Python 3.12. Task 1 local verification on August 4, 2026 used Node.js `v24.18.1` from `C:\Users\nguye\AppData\Roaming\fnm\node-versions\v24.18.1\installation`, Docker Compose `v5.3.1`, and a workstation that currently exposes Python `3.14.6` but not `py -3.12`. Expect the documented `py -3.12 --version` checkpoint to fail on this host until Python 3.12 is installed alongside the existing interpreter.

## Starting the Stack

From the repository root:

```powershell
docker compose up -d db
pnpm --filter api dev
pnpm --filter web dev
```

From `services/ingestion` after its application code is added in a later task:

```powershell
python -m uvicorn app.main:app --reload --port 8000
```

## Stopping the Stack

Use the command below to stop containers without deleting the named `postgres_data` volume:

```powershell
docker compose stop
```

Use `docker compose down` only when you want to remove the containers and network while preserving the named volume. Do not add `-v` unless you intend to delete the local database contents.
