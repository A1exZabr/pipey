FROM postgres:16-alpine
RUN apk add --no-cache curl bash \
    && curl -o /usr/local/bin/mc https://dl.min.io/client/mc/release/linux-amd64/mc \
    && chmod +x /usr/local/bin/mc
COPY scripts/backup-postgres.sh /scripts/backup-postgres.sh
COPY scripts/backup-minio.sh /scripts/backup-minio.sh
RUN chmod +x /scripts/*.sh \
    && echo '0 3 * * * /scripts/backup-postgres.sh >> /var/log/backup.log 2>&1' > /etc/crontabs/root \
    && echo '0 4 * * * /scripts/backup-minio.sh >> /var/log/backup.log 2>&1' >> /etc/crontabs/root
CMD ["crond", "-f"]
