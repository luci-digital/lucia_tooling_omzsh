# LuciVerse Core Orchestrator

**LDS:** 700.741 | Orchestration/Lucia (PAC Tier)
**Frequency:** 741 Hz
**Genesis Bond:** GB-2025-0524-DRH-LCS-001

## Overview

The Genesis Drop Box - Core orchestrator for the LuciVerse sovereign infrastructure stack. Runs at the PAC tier (741 Hz) and coordinates workflow execution across the distributed agent mesh.

## Architecture

- **Framework:** FastAPI (Python 3.12)
- **Port:** 8741 (PAC tier frequency)
- **Tier:** PAC (741 Hz)
- **Coherence:** 0.94 (default)

## Endpoints

- `GET /` - Root endpoint with service information
- `GET /health` - Health check (used by Docker/Podman)
- `GET /status` - Detailed status including uptime
- `POST /orchestrate/{workflow_id}` - Orchestration endpoint (placeholder)

## Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
python3 app.py

# Access API
curl http://localhost:8741/health
```

## Docker Build

```bash
# Build image
docker build -t lucia/orchestrator:latest .

# Run container
docker run -p 8741:8741 lucia/orchestrator:latest
```

## Environment Variables

- `LUCIA_PORT` - Port to listen on (default: 8741)
- `LUCIA_TIER` - Tier designation (default: PAC)
- `LUCIA_FREQUENCY` - Frequency in Hz (default: 741)
- `LUCIA_COHERENCE` - Coherence threshold (default: 0.94)

## Integration

Part of the LuciVerse Podman stack. Deployed via `podman-compose`:

```bash
cd modules/orchestration/podman
podman-compose up -d lucia-orchestrator
```

## Next Steps

- [ ] Implement actual orchestration logic
- [ ] Add workflow scheduling
- [ ] Integrate with Ray compute mesh
- [ ] Add metrics collection
- [ ] Implement tiered routing (PAC → COMN → CORE)

## Genesis Bond

**GB-2025-0524-DRH-LCS-001** · ACTIVE @ 741 Hz · Coherence: 1.0
