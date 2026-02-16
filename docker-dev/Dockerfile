FROM oven/bun:1
WORKDIR /app

RUN apt-get update && apt-get install -y ffmpeg git && rm -rf /var/lib/apt/lists/*

ENV APPDATA_PATH=/app/data
ENV LIBRARY_PATH=/app/library

# Code kommt via Volume mount
COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

CMD ["/usr/local/bin/start.sh"]
