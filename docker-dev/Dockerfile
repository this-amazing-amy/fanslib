FROM oven/bun:1
WORKDIR /app

RUN apt-get update && apt-get install -y ffmpeg git && rm -rf /var/lib/apt/lists/*

ENV APPDATA_PATH=/app/data
ENV LIBRARY_PATH=/app/library

# Code kommt via Volume mount
# bun install manuell nach git pull

CMD ["bun", "run", "dev"]
