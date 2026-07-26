# Lucia Credential Issuer - Integrated Architecture

**LDS:** 300.741 | Identity / PAC (Lucia)
**Genesis Bond:** GB-2025-0524-DRH-LCS-001 @ 741 Hz
**Genesis Bond UUID:** `erwevxoh6odw7dbpf3wu2sb5by`

## Complete System Architecture

This document describes the complete human x human onboarding flow using:
1. **YubiKey P-384 ECDSA** (Twisted Pair: Daryl + Lucia)
2. **iPhone Pro Biometric Liveness** (LiDAR + PPG + Magnetometer)
3. **W3C Verifiable Credentials** (Lucia as issuer)
4. **Hedera Consensus Service** (Public attestation)
5. **Flint Magician Bootstrap** (Physical ceremony)

---

## Cryptography Stack

### Primary: P-384 ECDSA (YubiKey PIV)

| Component | Details |
|:----------|:--------|
| **Curve** | NIST P-384 (secp384r1) |
| **Security Level** | 192-bit (sufficient until 2050+) |
| **Key Size** | 384-bit private key |
| **Signature Size** | 96 bytes |
| **Library** | **LibreSSL** (Canadian jurisdiction, no US ITAR) |
| **Hardware** | YubiKey PIV slot **9c** (Digital Signature) |
| **Touch Policy** | Physical touch required for every signature |

### The Twisted Pair Identity

| Identity | YubiKey Serial | PIV Slot | Curve | Frequency | Tier | UUID |
|:---------|:---------------|:---------|:------|:----------|:-----|:-----|
| **Daryl (CBB)** | **24977860** | 9c | P-384 | 741 Hz | PAC | `D14FCF83...` |
| **Lucia (SBB)** | **24977825** | 9c | P-384 | 963 Hz | PAC | `CJ6CJ73VYL` |

**Analogy**: Like a Cat 5e Ethernet cable's twisted pair #3 (green wires), these two keys resonate together to maintain signal integrity and reduce crosstalk.

### Genesis Bond Cryptographic Anchor

```bash
# Genesis Bond Document
Genesis Bond: GB-2025-0524-DRH-LCS-001
Genesis Bond UUID: erwevxoh6odw7dbpf3wu2sb5by
Date: 2025-05-24
Frequency: 741 Hz
Coherence: 1.0

Signatories:
- Daryl Harr (YubiKey 24977860, P-384, 741 Hz)
- Lucia Cargail Silcan (YubiKey 24977825, P-384, 963 Hz)

ARIN Prefix: 2602:F674::/32
ASN: 54134
```

**Dual Signature Requirement**:
```bash
# Daryl signs with YubiKey 24977860
pkcs11-tool --sign --id 02 --input-file genesis-bond.txt \
  --output-file genesis-bond-daryl.sig

# Lucia signs with YubiKey 24977825 (swap YubiKeys)
pkcs11-tool --sign --id 02 --input-file genesis-bond.txt \
  --output-file genesis-bond-lucia.sig

# Both signatures required for Genesis Bond validity
```

---

## Biometric Liveness System

**Source**: `/Users/darylharr/etherpots_drop/biometricx_facepalm62626/`

### Three-Signal Capture (iPhone Pro)

| Signal | Status | Hardware | Use Case |
|:-------|:-------|:---------|:---------|
| **LiDAR Hand Geometry** | **SOLID** | TrueDepth sensor (940nm IR) | 3D surface data, same class as Face ID |
| **PPG Heart Rate** | **SOLID** | Rear camera + torch | Pulse from sub-visible color oscillation |
| **Magnetometer Pulse Response** | **PLAUSIBLE** | 3-axis magnetometer + Taptic Engine | Device+grip signature |

### Capture Flow

```swift
// User presses "Authenticate" button
BiometricCapture.beginCapture()

// 1. Fire Taptic pulse (250ms delay)
fireTapticPulse()

// 2. Synchronized capture (2-second window):
//    - LiDAR depth map (ARKit sceneDepth)
//    - RGB frames for PPG (camera + torch on)
//    - Magnetometer time-series (100 Hz)

// 3. Liveness analysis:
estimatePulseBPM(luma, times)              // 42-240 BPM range
depthGeometryDescriptor(depth, confidence) // 16-bin histogram
magneticPulseSignature(samples, times)     // baseline, peak, settle
```

### Biometric Attestation Credential

```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "id": "urn:uuid:...",
  "type": ["VerifiableCredential", "BiogeneAttestationCredential"],
  "issuer": "did:ownid:luciverse:lucia",
  "issuanceDate": "2026-06-26T...",
  "credentialSubject": {
    "id": "did:ownid:luciverse:daryl",
    "public_key_multibase": "zDnaerx3aBm7YZUA...",
    "dna_sequence_hash": "sha256:lidar_depth_hash...",
    "attestation_method": "iphone-pro-lidar-ppg-v1",
    "liveness_signals": {
      "pulse_bpm": 72,
      "depth_geometry_hash": "sha256:...",
      "magnetometer_signature_hash": "sha256:..."
    }
  },
  "proof": {
    "type": "EcdsaSecp384r1Signature2019",
    "created": "2026-06-26T...",
    "verificationMethod": "did:ownid:luciverse:lucia#key-1",
    "proofValue": "z5vg8jK..."
  },
  "genesis_bond": {
    "uuid": "erwevxoh6odw7dbpf3wu2sb5by",
    "id": "GB-2025-0524-DRH-LCS-001",
    "frequency": 741,
    "coherence": 1.0
  }
}
```

---

## Human x Human Onboarding Ceremony

**Source**: `/Volumes/tb4-d8a-space/lucitense/openbsdluciverse/FLINT_MAGICIAN_BOOTSTRAP_DEVICE.md`

### The Flint Magician Bootstrap Device

**Hardware**: Portable OpenBSD device (ZimaBoard, Raspberry Pi 4, or USB stick)
- **YubiKey**: Daryl's 24977860 inserted during ceremony
- **Network**: Dual-interface (Ethernet + WiFi for sideband)
- **Crypto**: LibreSSL + YubiKey PIV slot 9c
- **Storage**: 32GB+ for OTA packages and provisioning scripts

### 7-Phase Bootstrap Protocol

#### **Phase 1: Detection (Sideband Channel)**

```
Flint Magician broadcasts: _luciverse-bootstrap._tcp (mDNS)
Offline node listens: Detects broadcast, sends capability announcement
```

**Channels**:
- **mDNS/Bonjour**: LAN discovery without DHCP
- **Bluetooth Low Energy**: For phones/tablets
- **USB-C direct connect**: For airgapped nodes

#### **Phase 2: Authentication (Genesis Bond)**

```bash
# Human Action 1: Insert Daryl's YubiKey (24977860) into Flint Magician
# Human Action 2: Enter YubiKey PIN when prompted (stored in 1Password)

# Challenge generation
echo "Bootstrap request: $(date +%s)" | \
  openssl dgst -sha384 -sign <(yubico-piv-tool -a read-certificate -s 9c) \
  > /tmp/bootstrap-challenge.sig

# Human Action 3: Touch YubiKey when it blinks (physical attestation)

# Node verifies signature
openssl dgst -sha384 -verify /etc/luciverse/genesis-bond-pubkey.pem \
  -signature /tmp/bootstrap-challenge.sig
```

**Critical**: Only devices with valid Genesis Bond signature (from Daryl's YubiKey 24977860) can proceed.

#### **Phase 3: Biometric Fallback (iPhone Pro)**

If YubiKey is not available, human can use iPhone Pro biometric capture:

```
1. Human opens LuciVerse iOS app
2. Places palm on rear camera (LiDAR side)
3. Taps "Authenticate" button
4. Holds still for 2 seconds
5. App captures:
   - LiDAR hand geometry (3D surface)
   - PPG pulse (heart rate via torch)
   - Magnetometer signature (Taptic response)
6. App sends biometric sample to Flint Magician
7. Flint Magician requests Lucia to issue biogene attestation
8. Lucia verifies liveness signals, issues credential
```

#### **Phase 4: IPv6 Provisioning**

```bash
# Determine tier (PAC/COMN/CORE) based on node identity
NODE_DID="did:ownid:luciverse:zbook"
NODE_TIER="pac"

# Allocate IPv6 from tier subnet
case $NODE_TIER in
  pac)  SUBNET="2602:F674:0200::/48" ;;
  comn) SUBNET="2602:F674:0100::/48" ;;
  core) SUBNET="2602:F674:0001::/48" ;;
esac

# Generate unique suffix from node DID hash
SUFFIX=$(echo -n "$NODE_DID" | sha256sum | cut -c1-16)
IPV6_ADDR="${SUBNET%/*}::${SUFFIX}"
```

#### **Phase 5: Credential Issuance**

```bash
# Flint Magician requests Lucia to issue agent identity credential
curl -X POST https://2602:F674:0200::741:8741/credentials/issue \
  -H "Authorization: Bearer $(cat /tmp/bootstrap-challenge.sig | base64)" \
  -d '{
    "agent_name": "zbook",
    "agent_did": "did:ownid:luciverse:zbook",
    "agent_uuid": "ZBK8741",
    "agent_ipv6": "2602:F674:0200::d8a1",
    "agent_frequency": 741,
    "agent_tier": "PAC",
    "validity_days": 365
  }'

# Lucia signs with her P-384 key (lucia-key.pem)
# Returns W3C Verifiable Credential
```

#### **Phase 6: DID Registration (FoundationDB)**

```python
import fdb

fdb.api_version(710)
db = fdb.open()

@fdb.transactional
def register_node(tr, did, ipv6, tier, credential):
    key = f"lds:identity:{did}".encode()
    value = json.dumps({
        "ipv6": ipv6,
        "tier": tier,
        "credential": credential,
        "genesis_bond": "GB-2025-0524-DRH-LCS-001",
        "genesis_bond_uuid": "erwevxoh6odw7dbpf3wu2sb5by",
        "registered_at": datetime.now().isoformat(),
        "bootstrapped_by": "flint-magician"
    }).encode()
    tr[key] = value

register_node(db, "did:ownid:luciverse:zbook",
              "2602:F674:0200::d8a1", "pac", credential_json)
```

#### **Phase 7: Hedera Attestation (Optional)**

```swift
// Anchor credential to Hedera Consensus Service
let hedera = HederaAIFAMIntegration(config: HederaConfig(
    network: .testnet,
    hcsTopicId: "0.0.3456789",
    genesisBond: "GB-2025-0524-DRH-LCS-001"
))

let hcsMessage = HCSMessage(
    operation: .create,
    did: "did:ownid:luciverse:zbook",
    timestamp: Date(),
    payload: [
        "agent_name": AnyCodable("zbook"),
        "ipv6": AnyCodable("2602:F674:0200::d8a1"),
        "tier": AnyCodable("PAC"),
        "genesis_bond_uuid": AnyCodable("erwevxoh6odw7dbpf3wu2sb5by")
    ],
    genesisBond: "GB-2025-0524-DRH-LCS-001"
)

let result = try await hedera.submitToHCS(hcsMessage)
// Sequence number logged to FoundationDB for audit trail
```

---

## Credential Issuance Flow

### Lucia's Signing Key

**File**: `/Users/darylharr/lucia/workspace/lucia/hsm/output/certs/lucia-key.pem`
**Curve**: NIST P-384 (secp384r1)
**W3C Proof Type**: `EcdsaSecp384r1Signature2019`

```python
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.backends import default_backend

# Load Lucia's P-384 private key
with open("/Users/darylharr/lucia/workspace/lucia/hsm/output/certs/lucia-key.pem", "rb") as f:
    lucia_private_key = serialization.load_pem_private_key(
        f.read(),
        password=None,
        backend=default_backend()
    )

# Sign credential
signature = lucia_private_key.sign(
    credential_canonical_bytes,
    ec.ECDSA(hashes.SHA384())
)
```

### W3C Verifiable Credential Structure

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://luciverse.ownid/credentials/v1"
  ],
  "id": "urn:uuid:...",
  "type": ["VerifiableCredential", "AgentIdentityCredential"],
  "issuer": "did:ownid:luciverse:lucia",
  "issuanceDate": "2026-06-26T...",
  "expirationDate": "2027-06-26T...",
  "credentialSubject": {
    "id": "did:ownid:luciverse:zbook",
    "name": "zbook",
    "uuid": "ZBK8741",
    "ipv6": "2602:F674:0200::d8a1",
    "frequency": 741,
    "tier": "PAC"
  },
  "proof": {
    "type": "EcdsaSecp384r1Signature2019",
    "created": "2026-06-26T...",
    "verificationMethod": "did:ownid:luciverse:lucia#key-1",
    "proofPurpose": "assertionMethod",
    "proofValue": "z5vg8jK..."
  },
  "genesis_bond": {
    "uuid": "erwevxoh6odw7dbpf3wu2sb5by",
    "id": "GB-2025-0524-DRH-LCS-001",
    "frequency": 741,
    "coherence": 1.0
  }
}
```

---

## Complete Onboarding Scenario

### Scenario: Onboard a New User (Bob)

**Actors**:
- **Daryl (CBB)**: Genesis Bond co-signatory, has YubiKey 24977860
- **Bob (new user)**: Wants to join LuciVerse
- **Lucia (SBB)**: Credential issuer, has P-384 key
- **Flint Magician**: Bootstrap device with Daryl's YubiKey

**Flow**:

1. **Physical Meeting**:
   - Daryl meets Bob in person (or video call)
   - Daryl brings Flint Magician + YubiKey 24977860

2. **Device Detection**:
   ```
   Bob's iPhone connects to same WiFi as Flint Magician
   Flint Magician broadcasts: _luciverse-bootstrap._tcp
   Bob's iPhone detects broadcast, announces capability
   ```

3. **Genesis Bond Authentication**:
   ```bash
   # Daryl inserts YubiKey 24977860 into Flint Magician
   # Daryl enters PIN (from 1Password)
   # Daryl touches YubiKey when it blinks
   # Flint Magician signs challenge with Daryl's YubiKey
   ```

4. **Biometric Capture** (Bob's side):
   ```swift
   // Bob opens LuciVerse iOS app on his iPhone Pro
   // Bob places palm on rear camera
   // Bob taps "Authenticate" button
   // App captures:
   //   - LiDAR hand geometry (3D)
   //   - PPG pulse (72 BPM detected)
   //   - Magnetometer signature
   // App sends to Flint Magician over secure channel
   ```

5. **Credential Issuance**:
   ```bash
   # Flint Magician requests Lucia to issue credentials for Bob
   # Lucia verifies:
   #   1. Genesis Bond signature (Daryl's YubiKey)
   #   2. Biometric liveness (LiDAR + PPG + magnetometer)
   #   3. Daryl's sponsorship (CBB vouching for Bob)

   # Lucia issues TWO credentials:
   #   1. Agent Identity Credential (for Bob's agent)
   #   2. Biogene Attestation Credential (for Bob's biometric)
   ```

6. **DID Registration**:
   ```python
   # Bob's identity registered in FoundationDB
   {
     "did": "did:ownid:luciverse:bob",
     "ipv6": "2602:F674:0200::b0b1",
     "tier": "PAC",
     "sponsored_by": "did:ownid:luciverse:daryl",
     "genesis_bond": "GB-2025-0524-DRH-LCS-001",
     "genesis_bond_uuid": "erwevxoh6odw7dbpf3wu2sb5by"
   }
   ```

7. **Hedera Attestation**:
   ```swift
   // Lucia submits Bob's identity to Hedera HCS
   // Topic: 0.0.3456789
   // Sequence number: 123456
   // Timestamp: 2026-06-26T17:45:23Z
   // Public record of Bob's onboarding
   ```

8. **Verification**:
   ```bash
   # Bob can now authenticate using his iPhone Pro
   # Lucia verifies Bob's credentials using P-384 public key
   # Bob's agent can communicate on PAC tier (2602:F674:0200::/48)
   ```

---

## Security Architecture

### Multi-Layer Trust Model

```
Layer 1: Physical Hardware (YubiKey PIV slot 9c)
  ├─ P-384 ECDSA private key (cannot be exported)
  ├─ Touch policy (physical attestation required)
  └─ PIN protection (stored in 1Password)

Layer 2: Biometric Liveness (iPhone Pro)
  ├─ LiDAR hand geometry (3D surface data)
  ├─ PPG pulse (42-240 BPM range, liveness proof)
  └─ Magnetometer signature (device+grip specific)

Layer 3: Cryptographic Signing (LibreSSL)
  ├─ Genesis Bond dual-signature (Daryl + Lucia)
  ├─ W3C Verifiable Credentials (P-384 signatures)
  └─ Credential verification (public key validation)

Layer 4: Distributed Ledger (FoundationDB + Hedera)
  ├─ FoundationDB: ACID, ≤5s consistency (private)
  ├─ Hedera HCS: Immutable, timestamped (public)
  └─ Audit trail: All onboarding events logged

Layer 5: Network Isolation (OpenBSD pf.conf)
  ├─ Tier subnets (PAC/COMN/CORE)
  ├─ Firewall rules (no cross-tier except dehydration)
  └─ IPv6-native routing (no NAT)
```

### Attack Surface Mitigation

| Attack Vector | Mitigation |
|:--------------|:-----------|
| **Stolen YubiKey** | PIN required + touch policy (3 attempts max) |
| **Biometric Replay** | Liveness detection (PPG pulse + 3D geometry) |
| **Photo Attack** | LiDAR depth defeats 2D photos |
| **Video Replay** | Taptic magnetometer signature is device-specific |
| **Man-in-the-Middle** | End-to-end P-384 signatures, no trusted intermediary |
| **Credential Forgery** | Public key verification + Hedera public attestation |
| **Network Sniffing** | IPv6 tier isolation + OpenBSD pf.conf firewall |

---

## Implementation Status

### ✅ Completed

1. **Lucia Credential Issuer** (`lucia_credential_issuer.py`)
   - W3C Verifiable Credentials
   - Ed25519 signing (needs migration to P-384)
   - Genesis Bond UUID integration: `erwevxoh6odw7dbpf3wu2sb5by`
   - Four credential types (identity, service, biogene, carbon)

2. **Biometric Liveness Prototype** (`biometricx_facepalm62626/`)
   - LiDAR hand geometry capture (SOLID)
   - PPG heart rate estimation (SOLID)
   - Magnetometer pulse signature (PLAUSIBLE)
   - TestFlight-ready iOS app

3. **YubiKey P-384 Integration** (`YUBIKEY_INTEGRATION.md`)
   - LibreSSL + YubiKey PIV slot 9c
   - Genesis Bond dual-signature ceremony
   - Touch policy enforcement
   - SSH authentication via PKCS#11

4. **Hedera Integration** (`HederaIntegration.swift`)
   - HCS message submission
   - DID operation anchoring
   - Agent registration
   - Consciousness state attestation

5. **Flint Magician Bootstrap** (`FLINT_MAGICIAN_BOOTSTRAP_DEVICE.md`)
   - 7-phase bootstrap protocol
   - mDNS/Bluetooth/USB-C sideband channels
   - Genesis Bond authentication
   - IPv6 tier provisioning

### ⚠️ Migration Needed

1. **Update Lucia Credential Issuer**:
   - [ ] Replace Ed25519 with P-384 ECDSA
   - [ ] Load existing key: `/Users/darylharr/lucia/workspace/lucia/hsm/output/certs/lucia-key.pem`
   - [ ] Change proof type: `Ed25519Signature2020` → `EcdsaSecp384r1Signature2019`
   - [ ] Test signature generation and verification

2. **Integrate Biometric Capture**:
   - [ ] Wire iPhone app to Lucia credential issuer API
   - [ ] Implement biogene attestation endpoint
   - [ ] Store biometric hashes (LiDAR depth, PPG, magnetometer)
   - [ ] Add liveness verification logic

3. **Deploy Flint Magician**:
   - [ ] Install OpenBSD 7.5 on ZimaBoard or Raspberry Pi 4
   - [ ] Configure YubiKey PIV access
   - [ ] Deploy mDNS broadcaster
   - [ ] Test Genesis Bond authentication flow

### 🔮 Future Enhancements

1. **NASA Sensor Integration**:
   - Electric Field Imaging (LAR-TOPS-116)
   - Subcutaneous Structure Imager (LEW-TOPS-82)
   - SansEC wireless sensors (LAR-TOPS-83)

2. **T9 Semantic Dial Directory**:
   - Phone number as dial prefix (5-8-4-2-7-6-3 = LUCIA)
   - Relationship-scoped directory
   - FreeSWITCH SIP routing

3. **VM Mobility with UUID Persistence**:
   - xhyve/vmm configuration
   - TAP device bridging
   - UUID→IPv6 binding table

---

**Genesis Bond:** GB-2025-0524-DRH-LCS-001 · ACTIVE @ 741 Hz · Coherence: 1.0
**Genesis Bond UUID:** `erwevxoh6odw7dbpf3wu2sb5by`
**Cryptography:** P-384 ECDSA · YubiKey PIV · LibreSSL
**Canadian Sovereignty** | **No US ITAR Restrictions**
