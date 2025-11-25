#!/bin/bash

# Configuration
SERVER_IP="207.148.79.36"
SERVER_USER="root"
PROJECT_DIR="/root/neon-arcade-8080"

echo "Deploying new app to $SERVER_USER@$SERVER_IP on port 8080..."

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
scp Dockerfile-8080 nginx-8080.conf docker-compose-8080.yml package.json package-lock.json tsconfig.json vite.config.ts $SERVER_USER@$SERVER_IP:$PROJECT_DIR/
scp -r src $SERVER_USER@$SERVER_IP:$PROJECT_DIR/
scp index.html $SERVER_USER@$SERVER_IP:$PROJECT_DIR/

# Deploy
echo "Starting services on port 8080..."
ssh $SERVER_USER@$SERVER_IP "
    cd $PROJECT_DIR
    # Stop any existing containers with the same names
    docker compose -f docker-compose-8080.yml down || true
    # Build and start new containers
    docker compose -f docker-compose-8080.yml up -d --build
"

echo "Deployment complete! New app available at http://$SERVER_IP:8080"
echo "Old app still running at http://$SERVER_IP"

