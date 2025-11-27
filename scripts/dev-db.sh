#!/bin/bash
# Load development environment variables and run Prisma command

set -a
source .env.development.local
set +a

exec "$@"
