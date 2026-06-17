# Pipey Docker Setup

## Quick start

### Running the project in Docker (production mode)

```bash
# Start the entire stack (built from local code)
./docker.sh start

# The project will be available at:
# Frontend:  http://localhost:3000
# Backend:   http://localhost:3001/api
# MinIO:     http://localhost:9001
```

### Development mode

```bash
# Start only the infrastructure (DB, Redis, MinIO)
./docker.sh dev

# Then, in separate terminals:
cd backend && npm run start:dev
cd frontend && npm run dev
```

## Management commands

### Main commands

```bash
./docker.sh start       # Start all services (production)
./docker.sh dev         # Start only the infrastructure
./docker.sh stop        # Stop all services
./docker.sh restart     # Restart all services
./docker.sh rebuild     # Rebuild and restart
./docker.sh status      # Show service status
```

### Logs

```bash
./docker.sh logs        # Show logs for all services
./docker.sh logs-f      # Follow logs in real time
./docker.sh logs backend  # Backend logs only
./docker.sh logs-f frontend  # Follow frontend logs
```

### Database

```bash
./docker.sh db-migrate  # Apply migrations
./docker.sh db-reset    # Reset the DB (deletes all data!)
```

### Debugging

```bash
./docker.sh shell-be    # Open a shell in the backend container
./docker.sh shell-fe    # Open a shell in the frontend container
./docker.sh test        # Run tests
```

### Cleanup

```bash
./docker.sh clean       # Remove all containers, volumes, and images
```

## Docker structure

### docker-compose.yml
Used for local development:
- Infrastructure only (Postgres, Redis, MinIO)
- Backend and frontend run locally with hot reload

### docker-compose.prod.yml
Used for testing the production build:
- Full stack built from local code
- Backend and frontend are built into Docker images
- Automatic migrations on startup

## Environment variables

All variables are configured in `docker-compose.prod.yml`:

- **DATABASE_URL**: `postgresql://pipey:pipey_dev_password@postgres:5432/pipey_db`
- **REDIS_URL**: `redis://redis:6379`
- **MinIO**: `pipey` / `pipey_dev_password`

For production, be sure to change:
- JWT_SECRET
- MAGIC_LINK_SECRET
- ENCRYPTION_KEY
- The MinIO password

## Ports

| Service  | Port  | Description                 |
|----------|-------|-----------------------------|
| Frontend | 3000  | Next.js application         |
| Backend  | 3001  | NestJS API                  |
| Postgres | 5432  | Database                    |
| Redis    | 6379  | Cache and queues            |
| MinIO    | 9000  | S3 API                      |
| MinIO UI | 9001  | MinIO web console           |

## Troubleshooting

### Containers won't start

```bash
# Check the status
./docker.sh status

# View the logs
./docker.sh logs-f

# Rebuild from scratch
./docker.sh rebuild
```

### Migration errors

```bash
# Enter the backend container
./docker.sh shell-be

# Run migrations manually
npx prisma migrate deploy

# Or reset the DB
./docker.sh db-reset
```

### Cleanup and fresh start

```bash
# Full cleanup
./docker.sh clean

# Fresh start
./docker.sh start
```

## Volumes

Docker stores data in volumes:

- `postgres_data_prod` - PostgreSQL data
- `redis_data_prod` - Redis data
- `minio_data_prod` - files in MinIO

To completely remove the data, use `./docker.sh clean`.

## CI/CD

For CI/CD, you can use the same `docker-compose.prod.yml`:

```bash
# In the CI pipeline
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml exec -T backend npm test
```

## Production Deployment

For production, we recommend:

1. Using separate images (push to a registry)
2. Using a managed DB (not a Docker container)
3. Configuring secrets via environment variables
4. Using a reverse proxy (nginx/traefik)
5. Configuring SSL/TLS certificates
6. Configuring backups for volumes
