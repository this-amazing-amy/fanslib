FROM oven/bun:1
WORKDIR /app

RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

ARG VITE_API_URL

ENV APPDATA_PATH=/app/data
ENV LIBRARY_PATH=/app/library
ENV VITE_API_URL=${VITE_API_URL}

COPY . .

RUN bun install

RUN bun run build

RUN mkdir -p /app/data /app/library

VOLUME ["/app/data", "/app/library"]

EXPOSE 6969 6970

CMD ["bun", "run", "start"]

