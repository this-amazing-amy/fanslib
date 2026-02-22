# Fanslib Dev Container

## Erstmaliges Setup

```bash
# Verzeichnisse erstellen
mkdir -p /mnt/user/appdata/fanslib/{git,data,library}

# Repo klonen
cd /mnt/user/appdata/fanslib/git
git clone https://github.com/GalateaPolymorph/fanslib.git .
```

## Build

```bash
cd /mnt/user/appdata/fanslib/git
docker build -t fanslib-dev -f docker-dev/Dockerfile docker-dev/
```

## Run

```bash
docker run -d \
  --name fanslib \
  --restart unless-stopped \
  -p 6969:6969 \
  -v /mnt/user/appdata/fanslib/git:/app \
  -v /mnt/user/appdata/fanslib/data:/app/data \
  -v /mnt/user/appdata/fanslib/library:/app/library \
  fanslib-dev

# Erstes Mal: Dependencies installieren
docker exec fanslib bun install
```

## Deploy (nach Code-Änderungen)

```bash
docker exec fanslib sh -c "git pull && bun install"
# Hot reload sollte greifen, sonst:
docker restart fanslib
```

## Logs

```bash
docker logs -f fanslib
```

## Pfade (Host)

| Was | Host | Container |
|-----|------|-----------|
| Code | `/mnt/user/appdata/fanslib/git` | `/app` |
| Data | `/mnt/user/appdata/fanslib/data` | `/app/data` |
| Library | `/mnt/user/appdata/fanslib/library` | `/app/library` |
| Port | 6969 | 6969 |
