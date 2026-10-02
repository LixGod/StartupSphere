# Docker Setup for Trendlyzer

This guide explains how to run Trendlyzer using Docker.

## Prerequisites

1. **Install Docker Desktop** (if not already installed):
   - Windows: Download from [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
   - Follow the installation wizard
   - Restart your computer if prompted

2. **Verify Docker installation**:
   ```powershell
   docker --version
   docker-compose --version
   ```

## Quick Start

### Development Mode

1. **Create `.env` file** (if not exists):
   ```powershell
   # Create .env file with your Groq API key
   echo "GROQ_API_KEY=your_groq_api_key_here" > .env
   ```
   Get your API key from [Groq Console](https://console.groq.com/)

2. **Run development server with Docker Compose**:
   ```powershell
   docker-compose -f docker-compose.dev.yml up --build
   ```

3. **Access the application**:
   - Open http://localhost:3000 in your browser

4. **Stop the container**:
   ```powershell
   docker-compose -f docker-compose.dev.yml down
   ```

### Production Mode

1. **Build the Docker image**:
   ```powershell
   docker build -t trendlyzer-app .
   ```

2. **Run the container**:
   ```powershell
   docker run -p 3000:3000 --env-file .env trendlyzer-app
   ```

   Or using Docker Compose:
   ```powershell
   docker-compose up --build
   ```

## Manual Docker Commands

### Pull Node.js Image
```powershell
docker pull node:24-alpine
```

### Create a Node.js Container for Testing
```powershell
docker run -it --rm --entrypoint sh node:24-alpine
```

### Verify Node.js Version
```powershell
node -v  # Should print "v24.12.0"
npm -v   # Should print "11.6.2"
```

## Environment Variables

Make sure your `.env` file contains:
```
GROQ_API_KEY=your_groq_api_key_here
```

## Troubleshooting

### Port Already in Use
If port 3000 is already in use, you can change it in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Change 3001 to any available port
```

### Container Not Starting
Check logs:
```powershell
docker-compose logs
```

### Rebuild After Code Changes
```powershell
docker-compose -f docker-compose.dev.yml up --build
```

### Clean Up
Remove containers and volumes:
```powershell
docker-compose down -v
```

## Docker Files

- `Dockerfile` - Production build
- `Dockerfile.dev` - Development build
- `docker-compose.yml` - Production compose
- `docker-compose.dev.yml` - Development compose
- `.dockerignore` - Files to exclude from Docker build
