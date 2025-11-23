FROM oven/bun:1
WORKDIR /app

RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

ENV PORT=8001
ENV APPDATA_PATH=/app/data
ENV LIBRARY_PATH=/app/library
ENV VITE_API_URL=http://localhost:8001

COPY . .

RUN bun install

RUN mkdir -p /app/data /app/library

VOLUME ["/app/data", "/app/library"]

EXPOSE 8001 5173

CMD ["bun", "run", "dev"]

