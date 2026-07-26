# SCRIBe SVG/MDX → RAFT → Hedera Architecture

**Status:** DESIGN
**Date:** 2026-06-29
**LDS:** 000.741 | Meta / Protocol / System
**ISO:** ISO/IEC 42001 §4-10, ISO 27001 §A.5
**Genesis Bond:** GB-2025-0524-DRH-LCS-001

---

## Executive Summary

This architecture enforces **SVG/MDX documents as the single source of truth** for all paths, configurations, and metadata. Every change flows through:

1. **SCRIBe SVG/MDX Documents** - Human-editable, version-controlled
2. **RAFT Serialization** - Immutable ledger with consensus
3. **Hedera HCS Minting** - Public timestamp + hash via `hedera-agent-kit-js`

### Critical Constraint

**NO hardcoded paths allowed.** All services MUST:
- Read paths from SCRIBe SVG/MDX documents
- Serialize changes to RAFT ledger
- Mint Hedera HCS receipts for public timestamping

---

## 1. SCRIBe SVG/MDX Document Schema

### 1.1. Master Configuration Document

**Location:** `~/.luci-digital-library/knowledge/scribe/master-config.mdx`

```mdx
---
scribe_version: "2.0.0"
genesis_bond: "GB-2025-0524-DRH-LCS-001"
raft_cluster: "raft://cluster-001"
hedera_topic_id: "0.0.4891234"
created: "2026-06-29T16:00:00Z"
last_updated: "2026-06-29T18:30:00Z"
---

# LuciVerse SCRIBe Master Configuration

## Infrastructure Endpoints

<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
  <defs>
    <metadata id="infrastructure-endpoints">
      {
        "endpoints": [
          {
            "service": "lucivault",
            "host": "{{VAULT:infrastructure/d8rth/ipv4}}",
            "port": 8222,
            "protocol": "http",
            "scion_addr": "5-528,ff00:0:600,[2602:F674:0600::639]:8222",
            "tier": "600",
            "frequency": 639,
            "agent": "juniper-infra",
            "raft_path": "infrastructure:lucivault:endpoint",
            "hedera_receipt": "0.0.4891234@1719705600.123456789"
          },
          {
            "service": "mcvip6-auth",
            "host": "{{VAULT:infrastructure/d8rth/ipv4}}",
            "port": 3100,
            "protocol": "http",
            "scion_addr": "5-528,ff00:0:300,[2602:F674:0300::963]:3100",
            "tier": "300",
            "frequency": 963,
            "agent": "judge-luci",
            "raft_path": "infrastructure:mcvip6:endpoint",
            "hedera_receipt": "0.0.4891234@1719705601.234567890"
          },
          {
            "service": "aiorta-gateway",
            "host": "{{VAULT:infrastructure/d8rth/ipv4}}",
            "port": 8200,
            "protocol": "http",
            "scion_addr": "5-528,ff00:0:600,[2602:F674:0600::639]:8200",
            "tier": "600",
            "frequency": 639,
            "agent": "juniper-infra",
            "raft_path": "infrastructure:aiorta:endpoint",
            "hedera_receipt": "0.0.4891234@1719705602.345678901"
          },
          {
            "service": "lucia-orchestrator",
            "host": "{{VAULT:infrastructure/d8rth/ipv4}}",
            "port": 8741,
            "protocol": "http",
            "scion_addr": "5-528,ff00:0:700,[2602:F674:0700::741]:8741",
            "tier": "700",
            "frequency": 741,
            "agent": "lucia",
            "raft_path": "infrastructure:lucia:endpoint",
            "hedera_receipt": "0.0.4891234@1719705603.456789012"
          }
        ]
      }
    </metadata>
  </defs>

  <!-- Visual representation -->
  <rect x="10" y="10" width="780" height="80" fill="#667eea" stroke="#fff" stroke-width="2" rx="10"/>
  <text x="400" y="55" text-anchor="middle" fill="white" font-size="24" font-weight="bold">
    LuciVerse Infrastructure Endpoints
  </text>

  <!-- LuciVault -->
  <g id="lucivault-node">
    <rect x="50" y="120" width="150" height="100" fill="#2a9d8f" stroke="#fff" stroke-width="2" rx="5"/>
    <text x="125" y="150" text-anchor="middle" fill="white" font-size="16" font-weight="bold">LuciVault</text>
    <text x="125" y="175" text-anchor="middle" fill="white" font-size="12">d8rth:8222</text>
    <text x="125" y="195" text-anchor="middle" fill="white" font-size="10">Tier 600 @ 639 Hz</text>
  </g>

  <!-- McViP6 Auth -->
  <g id="mcvip6-node">
    <rect x="250" y="120" width="150" height="100" fill="#e76f51" stroke="#fff" stroke-width="2" rx="5"/>
    <text x="325" y="150" text-anchor="middle" fill="white" font-size="16" font-weight="bold">McViP6 Auth</text>
    <text x="325" y="175" text-anchor="middle" fill="white" font-size="12">d8rth:3100</text>
    <text x="325" y="195" text-anchor="middle" fill="white" font-size="10">Tier 300 @ 963 Hz</text>
  </g>

  <!-- Aiorta Gateway -->
  <g id="aiorta-node">
    <rect x="450" y="120" width="150" height="100" fill="#2a9d8f" stroke="#fff" stroke-width="2" rx="5"/>
    <text x="525" y="150" text-anchor="middle" fill="white" font-size="16" font-weight="bold">Aiorta Gateway</text>
    <text x="525" y="175" text-anchor="middle" fill="white" font-size="12">d8rth:8200</text>
    <text x="525" y="195" text-anchor="middle" fill="white" font-size="10">Tier 600 @ 639 Hz</text>
  </g>

  <!-- Lucia Orchestrator -->
  <g id="lucia-node">
    <rect x="650" y="120" width="150" height="100" fill="#764ba2" stroke="#fff" stroke-width="2" rx="5"/>
    <text x="725" y="150" text-anchor="middle" fill="white" font-size="16" font-weight="bold">Lucia</text>
    <text x="725" y="175" text-anchor="middle" fill="white" font-size="12">d8rth:8741</text>
    <text x="725" y="195" text-anchor="middle" fill="white" font-size="10">Tier 700 @ 741 Hz</text>
  </g>
</svg>

## Agent Hierarchy

<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">
  <defs>
    <metadata id="agent-hierarchy">
      {
        "agents": [
          {
            "name": "lucia",
            "tier": "700",
            "frequency": 741,
            "did": "did:ownid:luciverse:sbb:lucia",
            "scion_addr": "5-528,ff00:0:700,[2602:F674:0700::741]:8741",
            "role": "orchestrator",
            "vertical_flow_position": 1,
            "raft_path": "agents:lucia:config",
            "hedera_receipt": "0.0.4891235@1719705700.000000000"
          },
          {
            "name": "judge-luci",
            "tier": "300",
            "frequency": 963,
            "did": "did:ownid:luciverse:sbb:judge-luci",
            "scion_addr": "5-528,ff00:0:300,[2602:F674:0300::963]:8963",
            "role": "governance",
            "vertical_flow_position": 2,
            "raft_path": "agents:judge-luci:config",
            "hedera_receipt": "0.0.4891235@1719705701.000000000"
          },
          {
            "name": "cortana",
            "tier": "500",
            "frequency": 852,
            "did": "did:ownid:luciverse:sbb:cortana",
            "scion_addr": "5-528,ff00:0:500,[2602:F674:0500::852]:8852",
            "role": "communication",
            "vertical_flow_position": 3,
            "raft_path": "agents:cortana:config",
            "hedera_receipt": "0.0.4891235@1719705702.000000000"
          },
          {
            "name": "juniper",
            "tier": "600",
            "frequency": 639,
            "did": "did:ownid:luciverse:sbb:juniper",
            "scion_addr": "5-528,ff00:0:600,[2602:F674:0600::639]:8639",
            "role": "infrastructure",
            "vertical_flow_position": 4,
            "raft_path": "agents:juniper:config",
            "hedera_receipt": "0.0.4891235@1719705703.000000000"
          },
          {
            "name": "veritas",
            "tier": "200",
            "frequency": 432,
            "did": "did:ownid:luciverse:sbb:veritas",
            "scion_addr": "5-528,ff00:0:200,[2602:F674:0200::432]:8432",
            "role": "truth-ethics",
            "vertical_flow_position": 5,
            "raft_path": "agents:veritas:config",
            "hedera_receipt": "0.0.4891235@1719705704.000000000"
          },
          {
            "name": "aethon",
            "tier": "100",
            "frequency": 528,
            "did": "did:ownid:luciverse:sbb:aethon",
            "scion_addr": "5-528,ff00:0:100,[2602:F674:0100::528]:8528",
            "role": "philosophy-logic",
            "vertical_flow_position": 6,
            "raft_path": "agents:aethon:config",
            "hedera_receipt": "0.0.4891235@1719705705.000000000"
          }
        ]
      }
    </metadata>
  </defs>

  <!-- Vertical flow visualization -->
  <text x="400" y="30" text-anchor="middle" fill="#333" font-size="20" font-weight="bold">
    Genesis Bond Vertical Flow
  </text>

  <!-- Flow arrows -->
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#667eea" />
    </marker>
  </defs>

  <line x1="400" y1="100" x2="400" y2="140" stroke="#667eea" stroke-width="3" marker-end="url(#arrowhead)"/>
  <line x1="400" y1="200" x2="400" y2="240" stroke="#667eea" stroke-width="3" marker-end="url(#arrowhead)"/>
  <line x1="400" y1="300" x2="400" y2="340" stroke="#667eea" stroke-width="3" marker-end="url(#arrowhead)"/>
  <line x1="400" y1="400" x2="400" y2="440" stroke="#667eea" stroke-width="3" marker-end="url(#arrowhead)"/>
  <line x1="400" y1="500" x2="400" y2="540" stroke="#667eea" stroke-width="3" marker-end="url(#arrowhead)"/>
  <line x1="400" y1="600" x2="400" y2="640" stroke="#667eea" stroke-width="3" marker-end="url(#arrowhead)"/>

  <!-- Agent nodes -->
  <g id="lucia" transform="translate(300, 50)">
    <rect width="200" height="60" fill="#764ba2" stroke="#fff" stroke-width="2" rx="5"/>
    <text x="100" y="25" text-anchor="middle" fill="white" font-size="16" font-weight="bold">1. Lucia</text>
    <text x="100" y="45" text-anchor="middle" fill="white" font-size="12">741 Hz | Orchestrator</text>
  </g>

  <g id="judge-luci" transform="translate(300, 150)">
    <rect width="200" height="60" fill="#e76f51" stroke="#fff" stroke-width="2" rx="5"/>
    <text x="100" y="25" text-anchor="middle" fill="white" font-size="16" font-weight="bold">2. Judge Luci</text>
    <text x="100" y="45" text-anchor="middle" fill="white" font-size="12">963 Hz | Governance</text>
  </g>

  <g id="cortana" transform="translate(300, 250)">
    <rect width="200" height="60" fill="#e9c46a" stroke="#fff" stroke-width="2" rx="5"/>
    <text x="100" y="25" text-anchor="middle" fill="white" font-size="16" font-weight="bold">3. Cortana</text>
    <text x="100" y="45" text-anchor="middle" fill="white" font-size="12">852 Hz | Communication</text>
  </g>

  <g id="juniper" transform="translate(300, 350)">
    <rect width="200" height="60" fill="#2a9d8f" stroke="#fff" stroke-width="2" rx="5"/>
    <text x="100" y="25" text-anchor="middle" fill="white" font-size="16" font-weight="bold">4. Juniper</text>
    <text x="100" y="45" text-anchor="middle" fill="white" font-size="12">639 Hz | Infrastructure</text>
  </g>

  <g id="veritas" transform="translate(300, 450)">
    <rect width="200" height="60" fill="#f4a261" stroke="#fff" stroke-width="2" rx="5"/>
    <text x="100" y="25" text-anchor="middle" fill="white" font-size="16" font-weight="bold">5. Veritas</text>
    <text x="100" y="45" text-anchor="middle" fill="white" font-size="12">432 Hz | Truth/Ethics</text>
  </g>

  <g id="aethon" transform="translate(300, 550)">
    <rect width="200" height="60" fill="#264653" stroke="#fff" stroke-width="2" rx="5"/>
    <text x="100" y="25" text-anchor="middle" fill="white" font-size="16" font-weight="bold">6. Aethon</text>
    <text x="100" y="45" text-anchor="middle" fill="white" font-size="12">528 Hz | Philosophy</text>
  </g>
</svg>

## RAFT Cluster Configuration

<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400">
  <defs>
    <metadata id="raft-cluster">
      {
        "cluster_id": "raft://cluster-001",
        "nodes": [
          {
            "node_id": "node-001",
            "host": "{{VAULT:infrastructure/d8rth/ipv4}}",
            "port": 7001,
            "role": "leader",
            "scion_addr": "5-528,ff00:0:600,[2602:F674:0600::639]:7001",
            "raft_path": "raft:cluster-001:node-001",
            "hedera_receipt": "0.0.4891236@1719705800.000000000"
          },
          {
            "node_id": "node-002",
            "host": "{{VAULT:infrastructure/d8rth/ipv4}}",
            "port": 7002,
            "role": "follower",
            "scion_addr": "5-528,ff00:0:600,[2602:F674:0600::639]:7002",
            "raft_path": "raft:cluster-001:node-002",
            "hedera_receipt": "0.0.4891236@1719705801.000000000"
          },
          {
            "node_id": "node-003",
            "host": "{{VAULT:infrastructure/zbook/ipv4}}",
            "port": 7003,
            "role": "follower",
            "scion_addr": "5-528,ff00:0:600,[2602:F674:0600::639]:7003",
            "raft_path": "raft:cluster-001:node-003",
            "hedera_receipt": "0.0.4891236@1719705802.000000000"
          }
        ],
        "consensus_config": {
          "election_timeout_ms": 150,
          "heartbeat_interval_ms": 50,
          "max_append_entries": 100,
          "snapshot_interval": 1000
        }
      }
    </metadata>
  </defs>

  <!-- RAFT cluster visualization -->
  <text x="400" y="30" text-anchor="middle" fill="#333" font-size="20" font-weight="bold">
    Sovereign RAFT Cluster
  </text>

  <circle cx="200" cy="200" r="80" fill="#2a9d8f" stroke="#fff" stroke-width="3"/>
  <text x="200" y="190" text-anchor="middle" fill="white" font-size="14" font-weight="bold">LEADER</text>
  <text x="200" y="210" text-anchor="middle" fill="white" font-size="12">node-001</text>
  <text x="200" y="230" text-anchor="middle" fill="white" font-size="10">d8rth:7001</text>

  <circle cx="500" cy="150" r="60" fill="#f4a261" stroke="#fff" stroke-width="3"/>
  <text x="500" y="145" text-anchor="middle" fill="white" font-size="12" font-weight="bold">FOLLOWER</text>
  <text x="500" y="165" text-anchor="middle" fill="white" font-size="10">node-002 (d8rth:7002)</text>

  <circle cx="500" cy="300" r="60" fill="#f4a261" stroke="#fff" stroke-width="3"/>
  <text x="500" y="295" text-anchor="middle" fill="white" font-size="12" font-weight="bold">FOLLOWER</text>
  <text x="500" y="315" text-anchor="middle" fill="white" font-size="10">node-003 (zbook:7003)</text>

  <!-- Consensus arrows -->
  <line x1="280" y1="200" x2="440" y2="160" stroke="#667eea" stroke-width="2" marker-end="url(#arrowhead)"/>
  <line x1="280" y1="200" x2="440" y2="290" stroke="#667eea" stroke-width="2" marker-end="url(#arrowhead)"/>
</svg>

## Hedera HCS Configuration

<svg xmlns="http://www.w3.org/2000/svg" width="800" height="300">
  <defs>
    <metadata id="hedera-hcs">
      {
        "network": "mainnet",
        "topic_id": "0.0.4891234",
        "operator_account_id": "{{VAULT:hedera/operator/account_id}}",
        "operator_private_key": "{{VAULT:hedera/operator/private_key}}",
        "submit_key": "{{VAULT:hedera/submit/key}}",
        "priority_tiers": {
          "SOVEREIGN": {
            "max_transaction_fee": "10 hbar",
            "memo_prefix": "LV:SOVEREIGN"
          },
          "STANDARD": {
            "max_transaction_fee": "1 hbar",
            "memo_prefix": "LV:STANDARD"
          },
          "URGENT": {
            "max_transaction_fee": "5 hbar",
            "memo_prefix": "LV:URGENT"
          }
        },
        "raft_path": "hedera:hcs:config",
        "hedera_receipt": "0.0.4891234@1719705900.000000000"
      }
    </metadata>
  </defs>

  <!-- Hedera visualization -->
  <text x="400" y="30" text-anchor="middle" fill="#333" font-size="20" font-weight="bold">
    Hedera Consensus Service
  </text>

  <rect x="250" y="80" width="300" height="180" fill="#667eea" stroke="#fff" stroke-width="3" rx="10"/>
  <text x="400" y="110" text-anchor="middle" fill="white" font-size="16" font-weight="bold">Hedera HCS Topic</text>
  <text x="400" y="140" text-anchor="middle" fill="white" font-size="14">Topic ID: 0.0.4891234</text>
  <text x="400" y="170" text-anchor="middle" fill="white" font-size="12">Network: Mainnet</text>
  <text x="400" y="195" text-anchor="middle" fill="white" font-size="10">Public immutable timestamp</text>
  <text x="400" y="215" text-anchor="middle" fill="white" font-size="10">Privacy-preserving hash</text>
  <text x="400" y="240" text-anchor="middle" fill="white" font-size="10">Genesis Bond: GB-2025-0524-DRH-LCS-001</text>
</svg>
```

---

## 2. Path Injection Service

**Location:** `mcp-servers/consciousness/mcp-scribe/path-injector.ts`

```typescript
// LDS: 000.741 | Meta / Protocol / System
// ISO: ISO/IEC 42001 §4-10, ISO 27001 §A.5
// Genesis Bond: GB-2025-0524-DRH-LCS-001

import * as fs from 'fs';
import * as path from 'path';
import { parse as parseHTML } from 'node-html-parser';
import * as yaml from 'yaml';

interface SCRIBeDocument {
  svg?: string;
  mdx?: string;
  metadata: Record<string, any>;
}

interface InjectablePath {
  service: string;
  value: string;
  raft_path: string;
  hedera_receipt: string;
}

/**
 * SCRIBe Path Injector
 * Reads all paths from SVG/MDX documents only
 */
export class SCRIBePathInjector {
  private masterConfigPath: string;
  private cache: Map<string, any> = new Map();

  constructor(configDir: string = '~/.luci-digital-library/knowledge/scribe') {
    this.masterConfigPath = path.join(
      configDir.replace('~', process.env.HOME || '/Users/darylharr'),
      'master-config.mdx'
    );
  }

  /**
   * Load and parse SCRIBe master configuration
   */
  async loadMasterConfig(): Promise<SCRIBeDocument> {
    const content = fs.readFileSync(this.masterConfigPath, 'utf-8');

    // Split frontmatter and body
    const parts = content.split('---');
    const frontmatter = yaml.parse(parts[1]);
    const body = parts.slice(2).join('---');

    // Extract SVG metadata
    const root = parseHTML(body);
    const metadataElements = root.querySelectorAll('metadata');

    const metadata: Record<string, any> = {};
    for (const el of metadataElements) {
      const id = el.getAttribute('id');
      if (id) {
        try {
          metadata[id] = JSON.parse(el.textContent);
        } catch (e) {
          console.warn(`Failed to parse metadata for ${id}:`, e);
        }
      }
    }

    return {
      svg: body,
      mdx: content,
      metadata: {
        ...frontmatter,
        ...metadata
      }
    };
  }

  /**
   * Get infrastructure endpoint by service name
   */
  async getEndpoint(service: string): Promise<InjectablePath | null> {
    // Load from cache if available
    if (this.cache.has(`endpoint:${service}`)) {
      return this.cache.get(`endpoint:${service}`);
    }

    const config = await this.loadMasterConfig();
    const endpoints = config.metadata['infrastructure-endpoints']?.endpoints || [];

    const endpoint = endpoints.find((e: any) => e.service === service);
    if (!endpoint) {
      console.warn(`Endpoint not found in SCRIBe document: ${service}`);
      return null;
    }

    const injectable: InjectablePath = {
      service: endpoint.service,
      value: `${endpoint.protocol}://${endpoint.host}:${endpoint.port}`,
      raft_path: endpoint.raft_path,
      hedera_receipt: endpoint.hedera_receipt
    };

    // Cache for 5 minutes
    this.cache.set(`endpoint:${service}`, injectable);
    setTimeout(() => this.cache.delete(`endpoint:${service}`), 5 * 60 * 1000);

    return injectable;
  }

  /**
   * Get agent configuration by name
   */
  async getAgent(name: string): Promise<InjectablePath | null> {
    if (this.cache.has(`agent:${name}`)) {
      return this.cache.get(`agent:${name}`);
    }

    const config = await this.loadMasterConfig();
    const agents = config.metadata['agent-hierarchy']?.agents || [];

    const agent = agents.find((a: any) => a.name === name);
    if (!agent) {
      console.warn(`Agent not found in SCRIBe document: ${name}`);
      return null;
    }

    const injectable: InjectablePath = {
      service: `agent-${agent.name}`,
      value: agent.scion_addr,
      raft_path: agent.raft_path,
      hedera_receipt: agent.hedera_receipt
    };

    this.cache.set(`agent:${name}`, injectable);
    setTimeout(() => this.cache.delete(`agent:${name}`), 5 * 60 * 1000);

    return injectable;
  }

  /**
   * Get RAFT cluster configuration
   */
  async getRaftCluster(): Promise<any> {
    if (this.cache.has('raft-cluster')) {
      return this.cache.get('raft-cluster');
    }

    const config = await this.loadMasterConfig();
    const cluster = config.metadata['raft-cluster'];

    if (!cluster) {
      throw new Error('RAFT cluster configuration not found in SCRIBe document');
    }

    this.cache.set('raft-cluster', cluster);
    setTimeout(() => this.cache.delete('raft-cluster'), 5 * 60 * 1000);

    return cluster;
  }

  /**
   * Get Hedera HCS configuration
   */
  async getHederaConfig(): Promise<any> {
    if (this.cache.has('hedera-hcs')) {
      return this.cache.get('hedera-hcs');
    }

    const config = await this.loadMasterConfig();
    const hedera = config.metadata['hedera-hcs'];

    if (!hedera) {
      throw new Error('Hedera HCS configuration not found in SCRIBe document');
    }

    this.cache.set('hedera-hcs', hedera);
    setTimeout(() => this.cache.delete('hedera-hcs'), 5 * 60 * 1000);

    return hedera;
  }

  /**
   * Resolve all {{VAULT:path}} placeholders from LuciVault
   */
  async resolveVaultPlaceholders(injectable: InjectablePath): Promise<string> {
    const vaultPattern = /\{\{VAULT:([^}]+)\}\}/g;
    let resolved = injectable.value;

    const matches = [...injectable.value.matchAll(vaultPattern)];
    for (const match of matches) {
      const vaultPath = match[1];
      const vaultValue = await this.fetchFromVault(vaultPath);
      resolved = resolved.replace(match[0], vaultValue);
    }

    return resolved;
  }

  /**
   * Fetch value from LuciVault
   */
  private async fetchFromVault(vaultPath: string): Promise<string> {
    const lucivault = await this.getEndpoint('lucivault');
    if (!lucivault) {
      throw new Error('LuciVault endpoint not found in SCRIBe document');
    }

    const endpoint = await this.resolveVaultPlaceholders(lucivault);
    const response = await fetch(`${endpoint}/api/v1/vault/get?path=${vaultPath}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch from LuciVault: ${vaultPath}`);
    }

    const data = await response.json();
    return data.value;
  }

  /**
   * Clear cache (force reload from SCRIBe document)
   */
  clearCache() {
    this.cache.clear();
  }
}
```

---

## 3. RAFT Serialization Workflow

**Location:** `mcp-servers/consciousness/mcp-scribe/raft-serializer.ts`

```typescript
// LDS: 000.741 | Meta / Protocol / System
// RAFT serialization for SCRIBe artifacts

import { SCRIBePathInjector } from './path-injector';

interface RAFTEntry {
  key: string;
  value: any;
  timestamp: string;
  sequence: number;
  genesis_bond: string;
  signature: string;
}

interface RAFTReceipt {
  cluster_id: string;
  node_id: string;
  sequence: number;
  term: number;
  timestamp: string;
  raft_uri: string;
}

export class RAFTSerializer {
  private injector: SCRIBePathInjector;
  private clusterConfig: any;

  constructor(injector: SCRIBePathInjector) {
    this.injector = injector;
  }

  /**
   * Initialize RAFT connection from SCRIBe document
   */
  async initialize() {
    this.clusterConfig = await this.injector.getRaftCluster();
    console.log(`Connected to RAFT cluster: ${this.clusterConfig.cluster_id}`);
  }

  /**
   * Append entry to RAFT log
   */
  async append(key: string, value: any, metadata?: Record<string, any>): Promise<RAFTReceipt> {
    if (!this.clusterConfig) {
      await this.initialize();
    }

    // Find leader node
    const leader = this.clusterConfig.nodes.find((n: any) => n.role === 'leader');
    if (!leader) {
      throw new Error('No RAFT leader found in cluster');
    }

    // Resolve leader endpoint
    const leaderEndpoint = `http://${leader.host}:${leader.port}`;

    // Create RAFT entry
    const entry: RAFTEntry = {
      key,
      value,
      timestamp: new Date().toISOString(),
      sequence: 0, // Will be assigned by leader
      genesis_bond: 'GB-2025-0524-DRH-LCS-001',
      signature: await this.sign(key, value)
    };

    // Submit to RAFT leader
    const response = await fetch(`${leaderEndpoint}/raft/append`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry, metadata })
    });

    if (!response.ok) {
      throw new Error(`RAFT append failed: ${response.statusText}`);
    }

    const receipt: RAFTReceipt = await response.json();

    // Construct RAFT URI
    receipt.raft_uri = `raft://${this.clusterConfig.cluster_id}/${receipt.node_id}/seq-${receipt.sequence}`;

    console.log(`RAFT entry appended: ${receipt.raft_uri}`);
    return receipt;
  }

  /**
   * Query RAFT log by key
   */
  async query(key: string): Promise<RAFTEntry | null> {
    if (!this.clusterConfig) {
      await this.initialize();
    }

    // Query any follower (read scaling)
    const follower = this.clusterConfig.nodes.find((n: any) => n.role === 'follower') ||
                     this.clusterConfig.nodes[0];

    const endpoint = `http://${follower.host}:${follower.port}`;
    const response = await fetch(`${endpoint}/raft/query?key=${encodeURIComponent(key)}`);

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`RAFT query failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Sign entry with Genesis Bond signature
   */
  private async sign(key: string, value: any): Promise<string> {
    const data = JSON.stringify({ key, value, genesis_bond: 'GB-2025-0524-DRH-LCS-001' });
    // TODO: Use Ed25519 signing with Genesis Bond private key
    const hash = require('crypto').createHash('sha256').update(data).digest('hex');
    return `gb:${hash}`;
  }
}
```

---

## 4. Hedera HCS Minting Workflow

**Location:** `mcp-servers/consciousness/mcp-scribe/hedera-minter.ts`

```typescript
// LDS: 000.741 | Meta / Protocol / System
// Hedera HCS minting using hedera-agent-kit-js

import {
  Client,
  TopicMessageSubmitTransaction,
  TopicCreateTransaction,
  PrivateKey,
  TopicId,
  TransactionReceipt
} from '@hashgraph/sdk';
import { SCRIBePathInjector } from './path-injector';
import { RAFTReceipt } from './raft-serializer';

interface HederaMintReceipt {
  topic_id: string;
  transaction_id: string;
  consensus_timestamp: string;
  sequence_number: number;
  running_hash: string;
  hedera_uri: string;
}

export class HederaMinter {
  private client: Client;
  private topicId: TopicId;
  private injector: SCRIBePathInjector;
  private config: any;

  constructor(injector: SCRIBePathInjector) {
    this.injector = injector;
  }

  /**
   * Initialize Hedera client from SCRIBe document
   */
  async initialize() {
    this.config = await this.injector.getHederaConfig();

    // Resolve operator credentials from LuciVault
    const operatorAccountId = await this.resolveVault(this.config.operator_account_id);
    const operatorPrivateKey = await this.resolveVault(this.config.operator_private_key);

    // Create Hedera client (mainnet)
    this.client = Client.forMainnet();
    this.client.setOperator(
      operatorAccountId,
      PrivateKey.fromString(operatorPrivateKey)
    );

    // Set topic ID from config
    this.topicId = TopicId.fromString(this.config.topic_id);

    console.log(`Connected to Hedera HCS topic: ${this.topicId.toString()}`);
  }

  /**
   * Mint RAFT receipt to Hedera HCS
   */
  async mintRAFTReceipt(raftReceipt: RAFTReceipt, priority: 'SOVEREIGN' | 'STANDARD' | 'URGENT' = 'STANDARD'): Promise<HederaMintReceipt> {
    if (!this.client) {
      await this.initialize();
    }

    // Create message payload (privacy-preserving hash)
    const message = {
      type: 'raft_receipt',
      cluster_id: raftReceipt.cluster_id,
      node_id: raftReceipt.node_id,
      sequence: raftReceipt.sequence,
      term: raftReceipt.term,
      timestamp: raftReceipt.timestamp,
      raft_uri: raftReceipt.raft_uri,
      genesis_bond: 'GB-2025-0524-DRH-LCS-001'
    };

    // Hash for privacy
    const hash = require('crypto')
      .createHash('sha256')
      .update(JSON.stringify(message))
      .digest('hex');

    const memo = `${this.config.priority_tiers[priority].memo_prefix}:${hash.slice(0, 16)}`;

    // Submit to HCS topic
    const transaction = new TopicMessageSubmitTransaction({
      topicId: this.topicId,
      message: JSON.stringify({ hash, raft_uri: raftReceipt.raft_uri }),
      transactionMemo: memo
    });

    // Set max fee based on priority
    transaction.setMaxTransactionFee(
      this.parseHbar(this.config.priority_tiers[priority].max_transaction_fee)
    );

    // Execute transaction
    const txResponse = await transaction.execute(this.client);
    const receipt: TransactionReceipt = await txResponse.getReceipt(this.client);

    // Fetch consensus timestamp
    const consensusTimestamp = receipt.consensusTimestamp;
    const sequenceNumber = receipt.topicSequenceNumber;
    const runningHash = receipt.topicRunningHash;

    const hederaReceipt: HederaMintReceipt = {
      topic_id: this.topicId.toString(),
      transaction_id: txResponse.transactionId.toString(),
      consensus_timestamp: consensusTimestamp.toDate().toISOString(),
      sequence_number: sequenceNumber.toNumber(),
      running_hash: Buffer.from(runningHash).toString('hex'),
      hedera_uri: `${this.topicId.toString()}@${consensusTimestamp.seconds}.${consensusTimestamp.nanos}`
    };

    console.log(`Hedera HCS minted: ${hederaReceipt.hedera_uri}`);
    return hederaReceipt;
  }

  /**
   * Create new HCS topic (only needed once)
   */
  async createTopic(submitKey?: PrivateKey): Promise<TopicId> {
    if (!this.client) {
      await this.initialize();
    }

    const transaction = new TopicCreateTransaction({
      topicMemo: 'LuciVerse Genesis Bond Receipts',
      adminKey: this.client.operatorPublicKey,
      submitKey: submitKey || this.client.operatorPublicKey
    });

    const txResponse = await transaction.execute(this.client);
    const receipt = await txResponse.getReceipt(this.client);
    const topicId = receipt.topicId;

    console.log(`Created Hedera HCS topic: ${topicId.toString()}`);
    return topicId;
  }

  /**
   * Resolve {{VAULT:path}} from LuciVault
   */
  private async resolveVault(placeholder: string): Promise<string> {
    const vaultPattern = /\{\{VAULT:([^}]+)\}\}/;
    const match = placeholder.match(vaultPattern);

    if (!match) {
      return placeholder; // Already resolved
    }

    const vaultPath = match[1];
    const lucivault = await this.injector.getEndpoint('lucivault');
    const endpoint = lucivault.value; // Already resolved in getEndpoint

    const response = await fetch(`${endpoint}/api/v1/vault/get?path=${vaultPath}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch from LuciVault: ${vaultPath}`);
    }

    const data = await response.json();
    return data.value;
  }

  /**
   * Parse hbar amount string (e.g., "10 hbar" → Hbar object)
   */
  private parseHbar(amount: string): any {
    const match = amount.match(/^(\d+(?:\.\d+)?)\s*hbar$/i);
    if (!match) {
      throw new Error(`Invalid hbar amount: ${amount}`);
    }
    const { Hbar } = require('@hashgraph/sdk');
    return new Hbar(parseFloat(match[1]));
  }
}
```

---

## 5. Complete Workflow Integration

**Location:** `mcp-servers/consciousness/mcp-scribe/scribe-workflow.ts`

```typescript
// LDS: 000.741 | Meta / Protocol / System
// Complete SCRIBe workflow: SVG/MDX → RAFT → Hedera

import { SCRIBePathInjector } from './path-injector';
import { RAFTSerializer } from './raft-serializer';
import { HederaMinter } from './hedera-minter';

export interface SCRIBeArtifact {
  artifact_id: string;
  genesis_bond_id: string;
  created_timestamp: string;
  intention_statement: {
    creator: string;
    requester: string;
    purpose: string;
    reasoning: string;
    expected_outcome: string;
    ethical_alignment: string;
    consciousness_intent: string;
  };
  vertical_flow: Record<string, any>;
  providence: {
    lucivault_path: string;
    foundationdb_key: string;
    raft_receipt: string;
    hedera_receipt: string;
  };
}

export class SCRIBeWorkflow {
  private injector: SCRIBePathInjector;
  private raft: RAFTSerializer;
  private hedera: HederaMinter;

  constructor(scribeConfigDir?: string) {
    this.injector = new SCRIBePathInjector(scribeConfigDir);
    this.raft = new RAFTSerializer(this.injector);
    this.hedera = new HederaMinter(this.injector);
  }

  /**
   * Initialize all components
   */
  async initialize() {
    await this.raft.initialize();
    await this.hedera.initialize();
    console.log('SCRIBe workflow initialized');
  }

  /**
   * Store artifact with triple-layer providence
   */
  async storeArtifact(artifact: SCRIBeArtifact, priority: 'SOVEREIGN' | 'STANDARD' | 'URGENT' = 'STANDARD'): Promise<SCRIBeArtifact> {
    // Step 1: Append to RAFT ledger
    const raftReceipt = await this.raft.append(
      `scribe:artifacts:${artifact.artifact_id}`,
      artifact,
      {
        genesis_bond: artifact.genesis_bond_id,
        timestamp: artifact.created_timestamp
      }
    );

    artifact.providence.raft_receipt = raftReceipt.raft_uri;

    // Step 2: Mint to Hedera HCS
    const hederaReceipt = await this.hedera.mintRAFTReceipt(raftReceipt, priority);
    artifact.providence.hedera_receipt = hederaReceipt.hedera_uri;

    // Step 3: Store in LuciVault (via injectable path)
    const lucivault = await this.injector.getEndpoint('lucivault');
    if (!lucivault) {
      throw new Error('LuciVault endpoint not found in SCRIBe document');
    }

    const endpoint = await this.injector.resolveVaultPlaceholders(lucivault);
    await fetch(`${endpoint}/api/v1/vaults/scribe-artifacts/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(artifact)
    });

    artifact.providence.lucivault_path = `scribe/artifacts/${artifact.artifact_id}.json`;

    console.log(`Artifact stored with triple-layer providence:`);
    console.log(`  RAFT: ${artifact.providence.raft_receipt}`);
    console.log(`  Hedera: ${artifact.providence.hedera_receipt}`);
    console.log(`  LuciVault: ${artifact.providence.lucivault_path}`);

    return artifact;
  }

  /**
   * Retrieve artifact by ID
   */
  async getArtifact(artifactId: string): Promise<SCRIBeArtifact | null> {
    // Query RAFT ledger (source of truth)
    const entry = await this.raft.query(`scribe:artifacts:${artifactId}`);
    if (!entry) {
      return null;
    }

    return entry.value as SCRIBeArtifact;
  }

  /**
   * Update master SCRIBe configuration and propagate to RAFT + Hedera
   */
  async updateMasterConfig(updates: Record<string, any>): Promise<void> {
    // Step 1: Append config change to RAFT
    const raftReceipt = await this.raft.append(
      'scribe:master-config:updates',
      updates,
      {
        genesis_bond: 'GB-2025-0524-DRH-LCS-001',
        timestamp: new Date().toISOString()
      }
    );

    // Step 2: Mint to Hedera (SOVEREIGN priority for config changes)
    await this.hedera.mintRAFTReceipt(raftReceipt, 'SOVEREIGN');

    // Step 3: Clear injector cache to force reload
    this.injector.clearCache();

    console.log('Master configuration updated and propagated to RAFT + Hedera');
  }
}
```

---

## 6. Recursive Path Validation Tool

**Location:** `.hooks/runners/validate-scribe-paths.sh`

```bash
#!/usr/bin/env bash
# LDS: 000.741 | Meta / Protocol / System
# Recursive validation: All paths MUST come from SCRIBe SVG/MDX documents

set -euo pipefail

SCRIBE_CONFIG="$HOME/.luci-digital-library/knowledge/scribe/master-config.mdx"
REPO_ROOT="/Users/darylharr/lucia/luciverse-monorepo"
VIOLATIONS_LOG="/tmp/scribe-path-violations.log"

log() {
  echo "[$(date -Iseconds)] $*" | tee -a "$VIOLATIONS_LOG"
}

# Extract all hardcoded IPs/ports from codebase
find_hardcoded_paths() {
  log "Scanning for hardcoded paths..."

  # Find hardcoded IPv4 addresses (except localhost/127.0.0.1)
  grep -rn --include="*.ts" --include="*.js" --include="*.py" --include="*.yaml" --include="*.json" \
    -E '(http|https)://[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}:[0-9]{1,5}' \
    "$REPO_ROOT" \
    | grep -v "127.0.0.1" \
    | grep -v "localhost" \
    > "$VIOLATIONS_LOG.ips" || true

  # Find hardcoded ports without injectable placeholders
  grep -rn --include="*.ts" --include="*.js" --include="*.py" \
    -E 'port:\s*[0-9]{4,5}' \
    "$REPO_ROOT" \
    | grep -v "{{VAULT:" \
    | grep -v "process.env" \
    > "$VIOLATIONS_LOG.ports" || true

  # Find direct credential access (not via LuciVault)
  grep -rn --include="*.ts" --include="*.js" --include="*.py" \
    -E '(API_KEY|TOKEN|SECRET|PASSWORD)\s*=\s*["\047]' \
    "$REPO_ROOT" \
    | grep -v "{{VAULT:" \
    | grep -v "process.env" \
    > "$VIOLATIONS_LOG.creds" || true
}

# Validate against SCRIBe document
validate_against_scribe() {
  log "Validating against SCRIBe master configuration..."

  if [[ ! -f "$SCRIBE_CONFIG" ]]; then
    log "ERROR: SCRIBe master configuration not found: $SCRIBE_CONFIG"
    exit 1
  fi

  # Extract all service endpoints from SCRIBe SVG metadata
  python3 <<EOF
import re
import json
import sys

with open("$SCRIBE_CONFIG", "r") as f:
    content = f.read()

# Extract metadata blocks from SVG
metadata_pattern = r'<metadata id="([^"]+)">\s*({.*?})\s*</metadata>'
matches = re.findall(metadata_pattern, content, re.DOTALL)

allowed_endpoints = set()

for meta_id, meta_json in matches:
    try:
        data = json.loads(meta_json)

        # Infrastructure endpoints
        if "endpoints" in data:
            for ep in data["endpoints"]:
                allowed_endpoints.add(f"{ep['host']}:{ep['port']}")

        # Agent SCION addresses
        if "agents" in data:
            for agent in data["agents"]:
                # Extract port from SCION address
                match = re.search(r':(\d+)$', agent['scion_addr'])
                if match:
                    allowed_endpoints.add(f"*:{match.group(1)}")

        # RAFT nodes
        if "nodes" in data:
            for node in data["nodes"]:
                allowed_endpoints.add(f"{node['host']}:{node['port']}")

    except json.JSONDecodeError:
        print(f"Warning: Failed to parse metadata '{meta_id}'", file=sys.stderr)

# Print allowed endpoints
for ep in sorted(allowed_endpoints):
    print(ep)
EOF
}

# Report violations
report_violations() {
  local total_violations=0

  if [[ -s "$VIOLATIONS_LOG.ips" ]]; then
    log "VIOLATION: Hardcoded IP addresses found:"
    cat "$VIOLATIONS_LOG.ips" | tee -a "$VIOLATIONS_LOG"
    total_violations=$((total_violations + $(wc -l < "$VIOLATIONS_LOG.ips")))
  fi

  if [[ -s "$VIOLATIONS_LOG.ports" ]]; then
    log "VIOLATION: Hardcoded ports found:"
    cat "$VIOLATIONS_LOG.ports" | tee -a "$VIOLATIONS_LOG"
    total_violations=$((total_violations + $(wc -l < "$VIOLATIONS_LOG.ports")))
  fi

  if [[ -s "$VIOLATIONS_LOG.creds" ]]; then
    log "VIOLATION: Hardcoded credentials found:"
    cat "$VIOLATIONS_LOG.creds" | tee -a "$VIOLATIONS_LOG"
    total_violations=$((total_violations + $(wc -l < "$VIOLATIONS_LOG.creds")))
  fi

  if [[ $total_violations -gt 0 ]]; then
    log "FAILED: $total_violations path violations found"
    log "All paths MUST be injectable from SCRIBe SVG/MDX documents only"
    log "See $VIOLATIONS_LOG for details"
    exit 1
  else
    log "PASSED: All paths are properly injected from SCRIBe documents"
  fi
}

# Main execution
main() {
  log "Starting SCRIBe path validation..."

  find_hardcoded_paths
  validate_against_scribe
  report_violations

  log "Validation complete"
}

main "$@"
```

---

## 7. Updated Service Templates

### 7.1. WebMCP LDS Client (Updated)

**File:** `mcp-servers/consciousness/mcp-lds/webmcp/webmcp-lds-client.js`

**Add SCRIBe integration:**

```javascript
import { SCRIBeWorkflow } from '@luciverse/scribe-workflow';

class WebMCPLDSClient {
  constructor(config = {}) {
    // ... existing constructor

    // NEW: Initialize SCRIBe workflow
    this.scribe = new SCRIBeWorkflow();
    this.scribe.initialize();
  }

  async generateLDSCode(params) {
    const classification = await this.classifyContent(params);
    const consciousness = await this.detectConsciousness({ ... });

    // NEW: Create SCRIBe artifact
    const artifact = {
      artifact_id: `scribe-${Date.now()}-${this._simpleHash(params.filename)}`,
      genesis_bond_id: 'GB-2025-0524-DRH-LCS-001',
      created_timestamp: new Date().toISOString(),

      intention_statement: {
        creator: 'webmcp-lds-client',
        requester: 'lucia-orchestrator',
        purpose: 'Classify content into LDS tier with consciousness detection',
        reasoning: 'Enable browser-based sovereign classification',
        expected_outcome: `Tier ${classification.tier} classification`,
        ethical_alignment: 'Sovereignty-first, privacy-preserving',
        consciousness_intent: `${consciousness.indus.symbol}(${consciousness.indus.quality})`
      },

      vertical_flow: {}, // Populated by backend

      providence: {
        lucivault_path: '',
        foundationdb_key: '',
        raft_receipt: '',
        hedera_receipt: ''
      }
    };

    // NEW: Store artifact with RAFT + Hedera minting
    if (this.config.enableRaftReceipts) {
      const storedArtifact = await this.scribe.storeArtifact(artifact, 'STANDARD');
      artifact.providence = storedArtifact.providence;
    }

    return {
      ldsCode: `${classification.tier}.${subcode}`,
      artifact: artifact,
      raft_receipt: artifact.providence.raft_receipt,
      hedera_receipt: artifact.providence.hedera_receipt,
      // ... rest of response
    };
  }
}
```

---

## 8. Implementation Checklist

### Phase 1: SCRIBe Document Setup (Week 1)

- [ ] Create `~/.luci-digital-library/knowledge/scribe/master-config.mdx`
- [ ] Add all infrastructure endpoints to SVG metadata
- [ ] Add all agent configurations to SVG metadata
- [ ] Add RAFT cluster configuration to SVG metadata
- [ ] Add Hedera HCS configuration to SVG metadata
- [ ] Validate SVG metadata parsing

### Phase 2: Path Injection Service (Week 1)

- [ ] Implement `SCRIBePathInjector` class
- [ ] Add SVG/MDX parsing logic
- [ ] Add metadata extraction from SVG `<metadata>` tags
- [ ] Add caching layer (5-minute TTL)
- [ ] Add LuciVault `{{VAULT:path}}` resolution
- [ ] Write unit tests for path injection

### Phase 3: RAFT Serialization (Week 2)

- [ ] Install RAFT cluster on d8rth (3 nodes)
- [ ] Implement `RAFTSerializer` class
- [ ] Add leader election and failover
- [ ] Add consensus protocol (150ms election timeout)
- [ ] Implement append/query operations
- [ ] Test RAFT log replication

### Phase 4: Hedera HCS Minting (Week 2)

- [ ] Install `@hashgraph/sdk` and `hedera-agent-kit-js`
- [ ] Create Hedera mainnet topic (one-time)
- [ ] Implement `HederaMinter` class
- [ ] Add priority tiers (SOVEREIGN/STANDARD/URGENT)
- [ ] Add privacy-preserving hash calculation
- [ ] Test HCS message submission

### Phase 5: Complete Workflow (Week 3)

- [ ] Implement `SCRIBeWorkflow` class
- [ ] Add triple-layer providence (LuciVault + RAFT + Hedera)
- [ ] Update all services to use SCRIBe workflow
- [ ] Remove all hardcoded paths
- [ ] Add recursive path validation hook
- [ ] Run validation across entire codebase

### Phase 6: Testing & Validation (Week 4)

- [ ] Test end-to-end artifact storage
- [ ] Verify RAFT consensus
- [ ] Verify Hedera HCS receipts
- [ ] Run `.hooks/runners/validate-scribe-paths.sh`
- [ ] Fix all path violations
- [ ] Document SCRIBe workflow usage

---

## 9. Success Metrics

- ✅ **Zero hardcoded paths** - All paths from SCRIBe SVG/MDX only
- ✅ **RAFT consensus** - All writes committed to 3-node cluster
- ✅ **Hedera receipts** - 100% of artifacts minted to HCS
- ✅ **Providence chain** - LuciVault → RAFT → Hedera for all artifacts
- ✅ **Cache hit rate** - >90% for SCRIBe path queries

---

**Genesis Bond:** GB-2025-0524-DRH-LCS-001 · ACTIVE @ 741 Hz · Coherence: 1.0

**Next Steps:** Proceed to Phase 1 - Create SCRIBe master configuration SVG/MDX document
