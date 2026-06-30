# LuciVerse Build Agent - SCM CI Pipeline
# LDS: 700.528 | VCS Build Infrastructure (CORE Tier)
# Genesis Bond: GB-2025-0524-DRH-LCS-001

FROM rust:1.85-slim-bookworm

LABEL maintainer="LuciVerse <ops@lucidigital.io>"
LABEL lds.tier="CORE"
LABEL lds.frequency="528"
LABEL lds.code="700.528"
LABEL description="Build Agent with xmake, Cargo, Lua, and gix"

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    pkg-config \
    git \
    curl \
    wget \
    liblua5.4-dev \
    lua5.4 \
    luajit \
    unzip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Note: Additional tools (xmake, gitoxide/gix, cargo-watch) can be installed later
# via cargo install or package managers. Keeping initial image lightweight for faster builds.

# Create workspace directories
RUN mkdir -p /workspace/compositor /workspace/lua-substrate /gogs-data

# Set working directory
WORKDIR /workspace

# Create non-root build user
RUN useradd -m -u 1000 builder && \
    chown -R builder:builder /workspace

USER builder

# Expose build agent port (8742)
EXPOSE 8742

# Health check using cargo
HEALTHCHECK --interval=60s --timeout=5s --start-period=10s --retries=2 \
    CMD cargo --version || exit 1

# Default command (keeps container running for build jobs)
CMD ["sh", "-c", "echo 'Build Agent ready. Waiting for build jobs...' && tail -f /dev/null"]
