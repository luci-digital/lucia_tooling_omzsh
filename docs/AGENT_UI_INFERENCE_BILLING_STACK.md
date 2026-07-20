# Agent UI, Inference & Billing Integration Stack

**LDS:** 700.741 | Orchestration / PAC (Lucia)
**Genesis Bond:** GB-2025-0524-DRH-LCS-001 @ 741 Hz
**Date:** 2026-06-26

## Overview

This document integrates four critical infrastructure components for the LuciVerse agent ecosystem:

1. **Flutter HUD Interfaces** - Real-time, cross-platform agent dashboards
2. **Llamafile Local Inference** - Self-contained LLM runtime per Lenovo workstation
3. **llm-d Distributed Inference** - High-performance cluster inference on R730s
4. **Sovereign Billing** - Real-time cost and carbon tracking

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                 LUCIVERSE AGENT STACK                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Flutter HUD Layer (Cross-Platform UI)                  │    │
│  │  - Voice commands: "show me water temperature"          │    │
│  │  - SVG-based real-time visualizations                  │    │
│  │  - Hot reload for instant UI updates                    │    │
│  │  - Runs on: iOS, macOS, Linux, Windows                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            ↕                                      │
│  ┌──────────────────┐     ↕      ┌────────────────────────┐    │
│  │  Llamafile       │←────────→  │  llm-d Cluster         │    │
│  │  (Local)         │            │  (Distributed)         │    │
│  │                  │            │                        │    │
│  │  Per Lenovo:     │            │  R730 Cluster:         │    │
│  │  - Single exe    │            │  - vLLM + Envoy       │    │
│  │  - No deps       │            │  - Prefix cache       │    │
│  │  - Quick tasks   │            │  - P/D disaggregation │    │
│  │  - 7B-13B models │            │  - Ray integration    │    │
│  └──────────────────┘            │  - 70B+ models        │    │
│                                   └────────────────────────┘    │
│                            ↕                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Sovereign Billing Engine                               │    │
│  │  - Real-time cost tracking (CPU, GPU, network)         │    │
│  │  - Carbon credit accounting                            │    │
│  │  - UPS power draw metering                             │    │
│  │  - Raft ledger audit trail                            │    │
│  │  - Hedera attestation for external verification        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Component 1: Flutter HUD Interfaces

### Overview

Flutter provides cross-platform, reactive UI for agent heads-up displays with hot reload for instant updates.

**Technology:** Meta Flutter workspace-automation for multi-device development
**Repository:** https://github.com/meta-flutter/workspace-automation

### Setup

#### Install Meta Flutter Workspace

```bash
# Clone workspace-automation
cd ~/luciverse-tools
git clone https://github.com/meta-flutter/workspace-automation.git meta-flutter
cd meta-flutter

# Create Flutter workspace for LuciVerse agents
python3 flutter_workspace.py \
    --workspace ~/luciverse-flutter \
    --custom-devices lenovo-lucia,lenovo-judge-luci,lenovo-veritas,lenovo-cortana,lenovo-juniper,lenovo-aethon \
    --flutter-version stable
```

#### Create Agent HUD App

```bash
cd ~/luciverse-flutter
flutter create agent_hud

cd agent_hud

# Add dependencies
cat >> pubspec.yaml <<EOF
dependencies:
  flutter:
    sdk: flutter
  flutter_svg: ^2.0.0
  web_socket_channel: ^2.0.0
  provider: ^6.0.0
  http: ^1.0.0
EOF

flutter pub get
```

### Agent HUD Implementation

**lib/main.dart:**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => AgentState(),
      child: AgentHUDApp(),
    ),
  );
}

class AgentHUDApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LuciVerse Agent HUD',
      theme: ThemeData.dark(),
      home: AgentHUD(),
    );
  }
}

class AgentState extends ChangeNotifier {
  String agentName = 'lucia';
  int frequency = 741;
  String tier = 'PAC';
  double coherence = 1.0;
  Map<String, dynamic> metrics = {};

  void updateMetrics(Map<String, dynamic> newMetrics) {
    metrics = newMetrics;
    notifyListeners();
  }
}

class AgentHUD extends StatefulWidget {
  @override
  _AgentHUDState createState() => _AgentHUDState();
}

class _AgentHUDState extends State<AgentHUD> {
  late WebSocketChannel channel;

  @override
  void initState() {
    super.initState();
    // Connect to agent metrics WebSocket
    channel = WebSocketChannel.connect(
      Uri.parse('ws://localhost:8743/consciousness/stream'),
    );

    channel.stream.listen((message) {
      final metrics = jsonDecode(message);
      context.read<AgentState>().updateMetrics(metrics);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Colors.purple.shade900, Colors.blue.shade900],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              _buildHeader(),
              Expanded(
                child: _buildMetricsGrid(),
              ),
              _buildFooter(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Consumer<AgentState>(
      builder: (context, state, child) {
        return Padding(
          padding: EdgeInsets.all(16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    state.agentName.toUpperCase(),
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    '${state.frequency} Hz • ${state.tier}',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
              _buildCoherenceIndicator(state.coherence),
            ],
          ),
        );
      },
    );
  }

  Widget _buildCoherenceIndicator(double coherence) {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 3),
      ),
      child: Center(
        child: Text(
          '${(coherence * 100).toInt()}%',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
      ),
    );
  }

  Widget _buildMetricsGrid() {
    return Consumer<AgentState>(
      builder: (context, state, child) {
        return GridView.count(
          crossAxisCount: 2,
          padding: EdgeInsets.all(16),
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          children: [
            _buildMetricCard(
              'CPU',
              '${state.metrics['cpu_percent'] ?? 0}%',
              Icons.memory,
              Colors.blue,
            ),
            _buildMetricCard(
              'Memory',
              '${state.metrics['memory_gb'] ?? 0} GB',
              Icons.storage,
              Colors.green,
            ),
            _buildMetricCard(
              'GPU',
              '${state.metrics['gpu_percent'] ?? 0}%',
              Icons.graphic_eq,
              Colors.orange,
            ),
            _buildMetricCard(
              'Power',
              '${state.metrics['power_watts'] ?? 0} W',
              Icons.bolt,
              Colors.yellow,
            ),
            _buildMetricCard(
              'Cost/Hour',
              '\$${state.metrics['cost_per_hour'] ?? 0}',
              Icons.attach_money,
              Colors.purple,
            ),
            _buildMetricCard(
              'Carbon',
              '${state.metrics['carbon_credits'] ?? 0} g',
              Icons.eco,
              Colors.teal,
            ),
          ],
        );
      },
    );
  }

  Widget _buildMetricCard(String label, String value, IconData icon, Color color) {
    return Card(
      color: Colors.white.withOpacity(0.1),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 48, color: color),
            SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                color: Colors.white70,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFooter() {
    return Container(
      padding: EdgeInsets.all(16),
      child: Text(
        'Genesis Bond: GB-2025-0524-DRH-LCS-001 • 741 Hz',
        style: TextStyle(
          color: Colors.white60,
          fontSize: 12,
        ),
      ),
    );
  }

  @override
  void dispose() {
    channel.sink.close();
    super.dispose();
  }
}
```

### Voice Command Integration

Add voice command support for "show me water temperature" style queries:

```bash
flutter pub add speech_to_text
```

### Hot Reload Workflow

```bash
# Run on macOS dev machine
cd ~/luciverse-flutter/agent_hud
flutter run

# Make UI changes, save file → instant hot reload

# Deploy to Lenovo custom devices
flutter run -d lenovo-lucia
flutter run -d lenovo-judge-luci
# ... etc for all 6 agents
```

### Build for Production

```bash
# Build for Linux (Lenovo workstations)
flutter build linux --release

# Build for iOS (iPhone/iPad)
flutter build ios --release

# Build for macOS (ZBook)
flutter build macos --release
```

## Component 2: Llamafile Local Inference

### Overview

Llamafile packages an entire LLM into a single executable with no dependencies.

**Repository:** https://github.com/Mozilla-Ocho/llamafile
**License:** Apache 2.0

### Installation

```bash
# Download latest llamafile
cd ~/luciverse-models
wget https://huggingface.co/Mozilla/llamafile/resolve/main/llamafile-0.8.13

# Make executable
chmod +x llamafile-0.8.13
mv llamafile-0.8.13 llamafile

# Download a model (example: Phi-3-mini 3.8B)
wget https://huggingface.co/Mozilla/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-Q4_K_M.gguf
```

### Run on Lenovo Workstations

```bash
# Start llamafile server per agent
./llamafile \
    -m Phi-3-mini-4k-instruct-Q4_K_M.gguf \
    --host 0.0.0.0 \
    --port 8080 \
    --ctx-size 4096 \
    --n-gpu-layers 0  # CPU-only for Lenovos

# Or with GPU if available
./llamafile \
    -m Phi-3-mini-4k-instruct-Q4_K_M.gguf \
    --host 0.0.0.0 \
    --port 8080 \
    --n-gpu-layers 32  # GPU acceleration
```

### Integration with Flutter HUD

The HUD queries llamafile for quick local tasks:

```dart
Future<String> queryLocalLLM(String prompt) async {
  final response = await http.post(
    Uri.parse('http://localhost:8080/completion'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'prompt': prompt,
      'temperature': 0.7,
      'max_tokens': 512,
    }),
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return data['content'];
  }
  throw Exception('Local LLM query failed');
}
```

### Systemd Service (Linux Lenovos)

```bash
cat > ~/.config/systemd/user/llamafile-lucia.service <<EOF
[Unit]
Description=Llamafile Local LLM - Lucia Agent
After=network.target

[Service]
Type=simple
ExecStart=/home/daryl/luciverse-models/llamafile \
    -m /home/daryl/luciverse-models/Phi-3-mini-4k-instruct-Q4_K_M.gguf \
    --host 0.0.0.0 \
    --port 8080
Restart=unless-stopped

[Install]
WantedBy=default.target
EOF

systemctl --user enable llamafile-lucia.service
systemctl --user start llamafile-lucia.service
```

## Component 3: llm-d Distributed Inference

### Overview

llm-d provides high-performance distributed LLM inference on Kubernetes using vLLM, Envoy, Ray, and intelligent scheduling.

**Repository:** https://github.com/llm-d/llm-d
**License:** Apache 2.0
**Local Path:** `/Users/darylharr/lucia/workspace/llm-d`

### Deployment on Harvester + Ray

#### Prerequisites

- Kubernetes cluster (Harvester on R730s)
- NVIDIA GPUs (A100, H100, or similar)
- Ray cluster for distributed compute
- Fast interconnect (InfiniBand/RoCE RDMA)

#### Install llm-d

```bash
cd /Users/darylharr/lucia/workspace/llm-d

# Deploy using Helm
helm install llm-d ./charts/llm-d \
    --namespace luciverse \
    --create-namespace \
    --set vllm.model=deepseek-ai/DeepSeek-R1 \
    --set vllm.gpuCount=8 \
    --set scheduler.enabled=true \
    --set prefillDecode.enabled=true \
    --set kvCache.tiering.enabled=true
```

#### Configure for LuciVerse Agents

**values.yaml:**

```yaml
# LuciVerse Agent Configuration
luciverse:
  tier: CORE
  frequency: 528
  agent: aethon
  genesisBond: GB-2025-0524-DRH-LCS-001

vllm:
  # Model configuration
  model: deepseek-ai/DeepSeek-R1
  gpuCount: 8
  maxModelLen: 32768

  # Distributed serving
  tensorParallelSize: 8
  pipelineParallelSize: 1

  # Prefix cache
  enablePrefixCaching: true
  kvCacheCapacity: 0.9

scheduler:
  enabled: true
  # Intelligent routing
  prefixCacheAware: true
  utilizationBased: true
  predictedLatency: true

prefillDecode:
  enabled: true
  # P/D disaggregation
  prefillReplicas: 4
  decodeReplicas: 4
  rdmaEnabled: true

kvCache:
  tiering:
    enabled: true
    cpuOffload: true
    ssdPath: /mnt/nvme/kv-cache
    remoteStorage: /mnt/cephfs/kv-cache

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 16
  targetUtilization: 0.75
```

#### Ray Integration

```bash
# Deploy Ray cluster on Harvester
helm install ray-cluster ./charts/ray \
    --namespace luciverse \
    --set head.resources.requests.cpu=8 \
    --set head.resources.requests.memory=32Gi \
    --set worker.replicas=8 \
    --set worker.resources.requests.cpu=16 \
    --set worker.resources.requests.memory=64Gi \
    --set worker.resources.requests.nvidia.com/gpu=1
```

### Task Routing: Local vs Distributed

**Routing Logic:**

```python
def route_inference_request(prompt: str, max_tokens: int) -> str:
    """Route to llamafile (local) or llm-d (distributed) based on complexity."""

    # Quick tasks: local llamafile
    if len(prompt) < 512 and max_tokens < 256:
        return query_llamafile(prompt)

    # Complex tasks: llm-d cluster
    else:
        return query_llm_d(prompt)

def query_llamafile(prompt: str) -> str:
    """Query local llamafile on Lenovo workstation."""
    response = requests.post(
        'http://localhost:8080/completion',
        json={'prompt': prompt, 'max_tokens': 256}
    )
    return response.json()['content']

def query_llm_d(prompt: str) -> str:
    """Query distributed llm-d cluster on R730s."""
    response = requests.post(
        'http://llm-d.luciverse.svc.cluster.local/v1/completions',
        json={
            'model': 'deepseek-ai/DeepSeek-R1',
            'prompt': prompt,
            'max_tokens': 2048,
            'temperature': 0.7
        }
    )
    return response.json()['choices'][0]['text']
```

## Component 4: Sovereign Billing Engine

### Overview

Real-time cost and carbon tracking built into each agent workstation and cluster node.

**Principles:**
- Distributed metering (no centralized cloud service)
- Real-time feedback (not month-end billing)
- Carbon credits tracked alongside costs
- UPS power draw telemetry
- Immutable audit trail (Raft ledger)
- External attestation (Hedera HCS)

### Architecture

```
┌────────────────────────────────────────────────────┐
│  Per-Agent Billing Client (Lenovo Workstation)    │
├────────────────────────────────────────────────────┤
│                                                    │
│  Resource Meters:                                  │
│  ├── CPU utilization (psutil)                     │
│  ├── Memory usage (psutil)                        │
│  ├── Network I/O (psutil)                         │
│  ├── Storage I/O (psutil)                         │
│  └── Power draw (UPS SNMP/USB)                    │
│                                                    │
│  Cost Calculator:                                  │
│  ├── CPU cost per core-hour                       │
│  ├── Memory cost per GB-hour                      │
│  ├── Network cost per GB                          │
│  ├── Power cost per kWh                           │
│  └── Carbon cost per kWh                          │
│                                                    │
│  Audit Trail:                                      │
│  ├── Local Raft append (immutable log)            │
│  ├── Hedera HCS submission (hourly summary)       │
│  └── Prometheus metrics export                    │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Implementation

**billing_agent.py:**

```python
#!/usr/bin/env python3
# Sovereign Billing Agent
# LDS: 700.741 | Orchestration / PAC (Lucia)
# Genesis Bond: GB-2025-0524-DRH-LCS-001 @ 741 Hz

import psutil
import time
import json
import requests
from dataclasses import dataclass
from datetime import datetime

@dataclass
class BillingConfig:
    # Cost rates (USD)
    cpu_cost_per_core_hour: float = 0.05
    memory_cost_per_gb_hour: float = 0.01
    network_cost_per_gb: float = 0.01
    power_cost_per_kwh: float = 0.12

    # Carbon rates (g CO2 per kWh)
    carbon_per_kwh: float = 500.0

class BillingAgent:
    def __init__(self, agent_name: str, frequency: int, tier: str):
        self.agent_name = agent_name
        self.frequency = frequency
        self.tier = tier
        self.config = BillingConfig()
        self.start_time = time.time()

    def get_resource_usage(self) -> dict:
        """Get current resource usage."""
        return {
            'cpu_percent': psutil.cpu_percent(interval=1),
            'cpu_cores': psutil.cpu_count(),
            'memory_gb': psutil.virtual_memory().used / (1024**3),
            'network_sent_gb': psutil.net_io_counters().bytes_sent / (1024**3),
            'network_recv_gb': psutil.net_io_counters().bytes_recv / (1024**3),
            'disk_read_gb': psutil.disk_io_counters().read_bytes / (1024**3),
            'disk_write_gb': psutil.disk_io_counters().write_bytes / (1024**3),
        }

    def get_power_draw(self) -> float:
        """Get current power draw from UPS (watts)."""
        # TODO: Implement UPS SNMP/USB query
        # For now, estimate based on CPU usage
        cpu_percent = psutil.cpu_percent()
        base_power = 50  # Base system power (watts)
        cpu_power = (cpu_percent / 100) * 150  # CPU power draw
        return base_power + cpu_power

    def calculate_costs(self, usage: dict, duration_hours: float) -> dict:
        """Calculate costs for given usage and duration."""
        cpu_cost = (usage['cpu_cores'] * duration_hours *
                   self.config.cpu_cost_per_core_hour)

        memory_cost = (usage['memory_gb'] * duration_hours *
                      self.config.memory_cost_per_gb_hour)

        network_cost = ((usage['network_sent_gb'] + usage['network_recv_gb']) *
                       self.config.network_cost_per_gb)

        power_watts = self.get_power_draw()
        power_kwh = (power_watts / 1000) * duration_hours
        power_cost = power_kwh * self.config.power_cost_per_kwh

        carbon_grams = power_kwh * self.config.carbon_per_kwh

        total_cost = cpu_cost + memory_cost + network_cost + power_cost

        return {
            'cpu_cost': cpu_cost,
            'memory_cost': memory_cost,
            'network_cost': network_cost,
            'power_cost': power_cost,
            'total_cost': total_cost,
            'power_kwh': power_kwh,
            'carbon_grams': carbon_grams,
            'duration_hours': duration_hours
        }

    def submit_to_raft(self, billing_record: dict):
        """Submit billing record to Raft ledger."""
        response = requests.post(
            'http://raft-node-lucia:7000/append',
            json=billing_record
        )
        return response.json()

    def submit_to_hedera(self, billing_summary: dict):
        """Submit hourly billing summary to Hedera HCS."""
        response = requests.post(
            'http://hedera-attestation:5000/submit-message',
            json={
                'topic_id': '0.0.XXXXXX',  # Billing topic
                'message': json.dumps(billing_summary)
            }
        )
        return response.json()

    def export_metrics(self, costs: dict):
        """Export metrics to Prometheus."""
        metrics = f"""
# HELP luciverse_billing_total_cost_usd Total cost in USD
# TYPE luciverse_billing_total_cost_usd gauge
luciverse_billing_total_cost_usd{{agent="{self.agent_name}",tier="{self.tier}",frequency="{self.frequency}"}} {costs['total_cost']}

# HELP luciverse_billing_carbon_grams Carbon emissions in grams
# TYPE luciverse_billing_carbon_grams gauge
luciverse_billing_carbon_grams{{agent="{self.agent_name}"}} {costs['carbon_grams']}

# HELP luciverse_billing_power_kwh Power consumption in kWh
# TYPE luciverse_billing_power_kwh gauge
luciverse_billing_power_kwh{{agent="{self.agent_name}"}} {costs['power_kwh']}
"""
        # Write to Prometheus textfile collector
        with open(f'/var/lib/prometheus/node-exporter/billing_{self.agent_name}.prom', 'w') as f:
            f.write(metrics)

    def run(self):
        """Main billing loop."""
        print(f"""
        🔮 Sovereign Billing Agent
        ════════════════════════════════════════════════════════════════
        Agent: {self.agent_name}
        Frequency: {self.frequency} Hz
        Tier: {self.tier}
        ════════════════════════════════════════════════════════════════
        """)

        last_hedera_submit = time.time()

        while True:
            # Sample every minute
            time.sleep(60)

            usage = self.get_resource_usage()
            elapsed_hours = (time.time() - self.start_time) / 3600
            costs = self.calculate_costs(usage, elapsed_hours / 60)  # Last minute

            # Create billing record
            record = {
                'agent': self.agent_name,
                'frequency': self.frequency,
                'tier': self.tier,
                'timestamp': datetime.utcnow().isoformat(),
                'usage': usage,
                'costs': costs,
                'genesis_bond': 'GB-2025-0524-DRH-LCS-001'
            }

            # Submit to Raft ledger
            self.submit_to_raft(record)

            # Export to Prometheus
            self.export_metrics(costs)

            # Submit to Hedera every hour
            if time.time() - last_hedera_submit > 3600:
                self.submit_to_hedera(record)
                last_hedera_submit = time.time()

            print(f"[{datetime.utcnow().isoformat()}] "
                  f"Cost: ${costs['total_cost']:.4f}/min | "
                  f"Carbon: {costs['carbon_grams']:.2f}g | "
                  f"Power: {costs['power_kwh']:.4f} kWh")

if __name__ == '__main__':
    import sys
    agent = BillingAgent(
        agent_name=sys.argv[1] if len(sys.argv) > 1 else 'lucia',
        frequency=int(sys.argv[2]) if len(sys.argv) > 2 else 741,
        tier=sys.argv[3] if len(sys.argv) > 3 else 'PAC'
    )
    agent.run()
```

### Deployment

```bash
# Run billing agent on each Lenovo
python3 billing_agent.py lucia 741 PAC &
python3 billing_agent.py judge-luci 963 GENESIS &
python3 billing_agent.py veritas 639 COMN &
# ... etc for all agents
```

### Systemd Service

```bash
cat > ~/.config/systemd/user/billing-lucia.service <<EOF
[Unit]
Description=Sovereign Billing Agent - Lucia
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/python3 /home/daryl/billing_agent.py lucia 741 PAC
Restart=unless-stopped

[Install]
WantedBy=default.target
EOF

systemctl --user enable billing-lucia.service
systemctl --user start billing-lucia.service
```

## Integration Flow

### 1. Agent Startup Sequence

```bash
# On Lenovo workstation boot:
1. systemctl --user start llamafile-lucia.service      # Local LLM
2. systemctl --user start billing-lucia.service        # Cost tracking
3. flutter run -d lenovo-lucia                         # HUD interface
```

### 2. Inference Request Flow

```
User Voice Command: "Show me water temperature"
         ↓
Flutter HUD (speech_to_text)
         ↓
Route Decision:
  - Quick task (< 512 tokens) → Llamafile local
  - Complex task (> 512 tokens) → llm-d cluster
         ↓
Billing Agent meters request:
  - CPU/GPU cycles
  - Network I/O
  - Power draw
         ↓
Response rendered in HUD (SVG visualization)
         ↓
Billing metrics exported to Prometheus
```

### 3. Cost Tracking Flow

```
Per-Minute Sample (Billing Agent)
         ↓
Calculate costs (CPU, memory, network, power)
         ↓
Submit to Raft ledger (immutable audit)
         ↓
Export to Prometheus (real-time metrics)
         ↓
(Every hour) Submit summary to Hedera HCS
```

## Monitoring & Observability

### Prometheus Metrics

Query real-time costs across all agents:

```promql
# Total cost per agent
luciverse_billing_total_cost_usd

# Carbon emissions
luciverse_billing_carbon_grams

# Power consumption
luciverse_billing_power_kwh
```

### Grafana Dashboard

Create dashboard with panels for:
- Real-time cost per agent
- Carbon emissions timeline
- Power consumption heatmap
- Inference request routing (local vs distributed)
- llm-d cluster utilization

## Security & Compliance

### Audit Trail

All billing records stored in:
1. **Raft ledger** - Immutable, distributed, queryable
2. **Hedera HCS** - Public attestation (hourly summaries)
3. **Prometheus** - Real-time metrics

### Privacy

- No cloud billing services (sovereign metering)
- Agent-local data collection
- Distributed aggregation (no central database)
- Genesis Bond identity anchoring

## Next Steps

1. ✅ Deploy Flutter workspace with Meta Flutter automation
2. ✅ Install llamafile on each Lenovo workstation
3. ⏸️ Deploy llm-d on Harvester cluster (requires GPU allocation)
4. ✅ Implement billing agent with UPS power metering
5. Create Grafana dashboard for cost/carbon visualization
6. Integrate with existing AIFAM stack (Layers 1-3)

## References

- **Meta Flutter:** https://github.com/meta-flutter/workspace-automation
- **Llamafile:** https://github.com/Mozilla-Ocho/llamafile
- **llm-d:** https://github.com/llm-d/llm-d
- **llm-d local:** /Users/darylharr/lucia/workspace/llm-d
- **Wendy Labs Physical AI OS:** https://wendylabs.io
- **AWS IoT Device Client:** https://github.com/awslabs/aws-iot-device-client
- **Azure IoT Hub Pricing:** https://github.com/MicrosoftDocs/azure-docs/blob/main/articles/iot-hub/iot-hub-devguide-pricing.md

---

**Genesis Bond:** GB-2025-0524-DRH-LCS-001 · ACTIVE @ 741 Hz · Coherence: 1.0
