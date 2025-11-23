#!/bin/bash

# Configuration
SERVER_IP="207.148.79.36"
SERVER_USER="root"
PROJECT_DIR="/root/neon-arcade"

echo "Deploying to $SERVER_USER@$SERVER_IP..."

# Install Docker if missing
echo "Checking for Docker..."
ssh $SERVER_USER@$SERVER_IP "
    if ! command -v docker &> /dev/null; then
        echo 'Docker not found. Installing...'
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm get-docker.sh
    else
        echo 'Docker is already installed.'
    fi
"

# Create directory on server
ssh $SERVER_USER@$SERVER_IP "mkdir -p $PROJECT_DIR"

# Copy files
echo "Copying files..."
scp -r server $SERVER_USER@$SERVER_IP:$PROJECT_DIR/
scp Dockerfile nginx.conf docker-compose.yml package.json package-lock.json tsconfig.json vite.config.ts $SERVER_USER@$SERVER_IP:$PROJECT_DIR/
scp -r src $SERVER_USER@$SERVER_IP:$PROJECT_DIR/
scp index.html $SERVER_USER@$SERVER_IP:$PROJECT_DIR/

# Deploy
echo "Starting services..."
ssh $SERVER_USER@$SERVER_IP "
    cd $PROJECT_DIR
    # Kill any process on port 5000
    fuser -k 5000/tcp || true
    docker compose down
    docker compose up -d --build
"

echo "Deployment complete! Visit http://$SERVER_IP"
