# LuciVerse Core Orchestrator - Genesis Drop Box (741 Hz)
# LDS: 700.741 | Orchestration/Lucia (PAC Tier)
# Genesis Bond: GB-2025-0524-DRH-LCS-001

FROM python:3.12-slim

LABEL maintainer="LuciVerse <ops@lucidigital.io>"
LABEL lds.tier="PAC"
LABEL lds.frequency="741"
LABEL lds.code="700.741"
LABEL description="Genesis Drop Box - LuciVerse Core Orchestrator"

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user for security
RUN useradd -m -u 1000 lucia && \
    chown -R lucia:lucia /app

USER lucia

# Expose PAC tier port (741 Hz)
EXPOSE 8741

# Health check on /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8741/health')"

# Environment variables
ENV LUCIA_PORT=8741
ENV LUCIA_TIER=PAC
ENV LUCIA_FREQUENCY=741
ENV LUCIA_COHERENCE=0.94

# Start the orchestrator
CMD ["python3", "app.py"]
