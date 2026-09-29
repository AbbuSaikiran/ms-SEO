# Use official Node.js image for building the frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Use Python image for the backend
FROM python:3.11-slim
WORKDIR /app

# Install Node.js for any npx/node operations needed by the agent
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean

# Copy backend requirements and install
COPY requirements.txt backend/requirements.txt* ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend assets to backend for static serving (if you configure FastAPI to serve them)
# Otherwise, we can just run both or use a process manager. 
# Here we'll configure it to run the FastAPI backend which can also serve the frontend.
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose the backend port
EXPOSE 8000

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

# Command to run the backend server with dynamic PORT support for Railway / Cloud hosts
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

