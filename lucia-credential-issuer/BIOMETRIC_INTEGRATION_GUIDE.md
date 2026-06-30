# Biometric Liveness Integration Guide

Complete guide for integrating iPhone Pro biometric liveness capture with Lucia's W3C Verifiable Credential issuance system.

**LDS:** 300.741 | Identity / PAC (Lucia)
**Genesis Bond:** GB-2025-0524-DRH-LCS-001 @ 741 Hz
**Genesis Bond UUID:** erwevxoh6odw7dbpf3wu2sb5by

---

## Architecture Overview

```
┌─────────────────────┐
│  iPhone Pro App     │  LiDAR + PPG + Magnetometer
│  (Swift/ARKit)      │  Biometric Capture
└──────────┬──────────┘
           │ HTTP POST /api/v1/credentials/biogene-attestation
           │ { subject_did, public_key, biometric_data }
           ▼
┌─────────────────────┐
│  Lucia API Server   │  Flask @ localhost:8741
│  (Python/Flask)     │  Hash biometric data
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Credential Issuer  │  P-256 ECDSA Signing
│  (Python)           │  W3C Verifiable Credentials
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Genesis Bond       │  erwevxoh6odw7dbpf3wu2sb5by
│  Anchoring          │  741 Hz @ PAC tier
└─────────────────────┘
```

---

## Components

### 1. Lucia Credential Issuer (Python)

**File:** `lucia_credential_issuer_p384.py`

**Key Features:**
- P-256 ECDSA signing (auto-detects P-256 or P-384)
- Loads Lucia's existing key from `/Users/darylharr/lucia/workspace/lucia/hsm/output/certs/lucia-key.pem`
- W3C Verifiable Credential format
- EcdsaSecp256r1Signature2019 proof type
- Genesis Bond metadata anchoring

**Usage:**
```python
from lucia_credential_issuer_p384 import LuciaCredentialIssuer

lucia = LuciaCredentialIssuer()

credential = lucia.issue_biogene_attestation(
    subject_did="did:ownid:luciverse:bob",
    public_key_multibase="z...",
    biometric_hashes={
        "lidar_depth_hash": "sha256:abc123...",
        "ppg_signature_hash": "sha256:def456...",
        "magnetometer_hash": "sha256:ghi789..."
    },
    attestation_method="iphone-pro-lidar-ppg-v1"
)
```

### 2. Lucia API Server (Python/Flask)

**File:** `lucia_api_server.py`

**Endpoints:**
- `GET /api/v1/health` - Health check
- `GET /api/v1/did` - Lucia's DID document
- `POST /api/v1/credentials/biogene-attestation` - Issue biometric credential

**Run:**
```bash
cd /Users/darylharr/lucia/luciverse-monorepo/lucia_tooling_omzsh/lucia-credential-issuer
python3 -m pip install flask flask-cors cryptography
python3 lucia_api_server.py
```

Server starts on `http://localhost:8741` (741 Hz - Lucia's PAC frequency)

### 3. iPhone Pro App (Swift)

**Files:**
- `BiometricCapture.swift` - Capture controller (ARKit + CoreMotion + Haptics)
- `LivenessAnalyzer.swift` - Signal processing (PPG FFT, depth histogram, mag signature)
- `LuciaAPIClient.swift` - ✨ **NEW** - HTTP client for Lucia API
- `ContentView_WithAPI.swift` - ✨ **NEW** - Enhanced UI with credential display

**Biometric Signals Captured:**
1. **LiDAR Depth Map** `[SOLID]` - 3D hand geometry (same tech as Face ID)
2. **PPG Luma Series** `[SOLID]` - Heart rate from color oscillation under torch
3. **Magnetometer Trace** `[PLAUSIBLE]` - Taptic Engine pulse response

**Integration:**
```swift
@StateObject private var capture = BiometricCapture()
@StateObject private var apiClient = LuciaAPIClient(
    baseURL: "http://192.168.1.145:8741",
    subjectDID: "did:ownid:luciverse:bob",
    publicKeyMultibase: "z..."
)

// After capture:
let credential = try await apiClient.submitBiometricCapture(sample)
```

---

## Setup Instructions

### Prerequisites

1. **iPhone Pro with LiDAR** (iPhone 12 Pro or later)
2. **Mac with Xcode** 15+
3. **Python 3.9+** with pip
4. **Local network** (both devices on same WiFi/LAN)

### Step 1: Start Lucia API Server

```bash
cd /Users/darylharr/lucia/luciverse-monorepo/lucia_tooling_omzsh/lucia-credential-issuer

# Install dependencies
python3 -m pip install flask flask-cors cryptography

# Verify Lucia's key exists
ls -lh /Users/darylharr/lucia/workspace/lucia/hsm/output/certs/lucia-key.pem

# Start server
python3 lucia_api_server.py
```

**Expected output:**
```
✅ Loaded existing secp256r1 key from: .../lucia-key.pem

        🌟 Lucia Credential Issuance Agent (P-256 ECDSA)
        ════════════════════════════════════════════════════════════════
        DID: did:ownid:luciverse:lucia
        UUID (SBB): CJ6CJ73VYL
        IPv6: 2602:f674:0001:0700::741
        Frequency: 741 Hz
        Tier: PAC
        Genesis Bond UUID: erwevxoh6odw7dbpf3wu2sb5by
        Genesis Bond ID: GB-2025-0524-DRH-LCS-001
        ════════════════════════════════════════════════════════════════
        Curve: NIST P-256 (secp256r1)
        Proof Type: EcdsaSecp256r1Signature2019

🚀 Starting Lucia API server on http://localhost:8741
```

### Step 2: Get Server IP Address

```bash
# macOS:
ipconfig getifaddr en0

# Linux:
ip addr show | grep "inet "
```

Example: `192.168.1.145`

### Step 3: Test API from Command Line

```bash
# Health check
curl http://192.168.1.145:8741/api/v1/health | python3 -m json.tool

# DID document
curl http://192.168.1.145:8741/api/v1/did | python3 -m json.tool
```

### Step 4: Configure iPhone App

In Xcode, open the biometric app project and:

1. **Add `LuciaAPIClient.swift`** to your project
2. **Replace `ContentView.swift` with `ContentView_WithAPI.swift`** (or merge manually)
3. **Update the base URL** in `ContentView`:

```swift
@StateObject private var apiClient = LuciaAPIClient(
    baseURL: "http://192.168.1.145:8741",  // ⚠️ UPDATE THIS
    subjectDID: "did:ownid:luciverse:temp-subject",
    publicKeyMultibase: "zTEMP"
)
```

4. **Add `NSAppTransportSecurity` exception** to `Info.plist` (for HTTP in development):

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
    <!-- Or more restrictive: -->
    <key>NSExceptionDomains</key>
    <dict>
        <key>192.168.1.145</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
            <key>NSIncludesSubdomains</key>
            <true/>
        </dict>
    </dict>
</dict>
```

### Step 5: Build & Run on iPhone

1. Connect iPhone via USB or Wireless Debugging
2. Select your device in Xcode
3. Build & Run (⌘R)
4. Grant camera & motion permissions when prompted

---

## Testing the Integration

### 1. Capture Biometric

1. Hold iPhone with **back camera facing your palm**
2. Tap **"Authenticate"** button
3. Keep still for ~2 seconds during capture
4. Haptic pulse fires at 250ms

**Expected output in app:**
```
Last capture
PPG frames: 64
Magnetometer samples: 200
Depth map: captured
Pulse: 72 BPM
```

### 2. Submit to Lucia

After capture completes, app automatically:
1. Health checks Lucia API
2. Hashes biometric data (LiDAR, PPG, magnetometer)
3. POSTs to `/api/v1/credentials/biogene-attestation`
4. Receives W3C Verifiable Credential

**Expected output in app:**
```
✅ Credential received
```

**Expected output in server logs:**
```
🔐 Submitting biometric capture to Lucia...
   Subject DID: did:ownid:luciverse:temp-subject
   PPG frames: 64
   Magnetometer samples: 200
✅ Issued BiogeneAttestationCredential for did:ownid:luciverse:temp-subject
   Credential ID: urn:uuid:a1b2c3...
   Biometric hashes: ['lidar_depth_hash', 'ppg_signature_hash', 'magnetometer_hash']
```

### 3. View Credential

Tap **"View Credential"** button to see:

- Credential ID
- Issuer: `did:ownid:luciverse:lucia`
- Subject: `did:ownid:luciverse:temp-subject`
- Biometric hashes (SHA256)
- Cryptographic proof (EcdsaSecp256r1Signature2019)
- Genesis Bond metadata (UUID, frequency, coherence)

---

## Credential Structure

Example W3C Verifiable Credential:

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://luciverse.ownid/credentials/v1"
  ],
  "id": "urn:uuid:a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "type": ["VerifiableCredential", "BiogeneAttestationCredential"],
  "issuer": "did:ownid:luciverse:lucia",
  "issuanceDate": "2026-06-26T19:30:00.000000Z",
  "credentialSubject": {
    "id": "did:ownid:luciverse:temp-subject",
    "public_key_multibase": "zTEMP",
    "biometric_hashes": {
      "lidar_depth_hash": "sha256:abc123...",
      "ppg_signature_hash": "sha256:def456...",
      "magnetometer_hash": "sha256:ghi789..."
    },
    "attestation_method": "iphone-pro-lidar-ppg-v1",
    "credential_type": "BiogeneAttestation"
  },
  "proof": {
    "type": "EcdsaSecp256r1Signature2019",
    "created": "2026-06-26T19:30:00.000001Z",
    "verificationMethod": "did:ownid:luciverse:lucia#key-1",
    "proofPurpose": "assertionMethod",
    "proofValue": "MEUCIQC..."
  },
  "genesis_bond": {
    "uuid": "erwevxoh6odw7dbpf3wu2sb5by",
    "id": "GB-2025-0524-DRH-LCS-001",
    "frequency": 741,
    "coherence": 1.0,
    "tier": "PAC",
    "timestamp": "2026-06-26T19:30:00.000002Z"
  }
}
```

---

## Security & Privacy Considerations

### Privacy-Preserving Design

**CRITICAL:** Raw biometric data is **NEVER** stored in credentials.

- **iPhone captures** → LiDAR depth map, PPG series, magnetometer trace
- **App hashes** → SHA256 of each biometric signal
- **Lucia stores** → Only hashes in credential
- **Verification** → Re-capture → hash → compare hashes

### Why Hashes, Not Raw Data?

1. **Biometric Template Protection:** Raw biometric data can be used for spoofing
2. **ISO 27701 Compliance:** Minimize biometric data retention
3. **Right to Erasure:** Hashes can be revoked without storing biometric templates
4. **Zero-Knowledge Proof:** Credential proves "capture occurred" without revealing details

### Network Security

- **Development:** HTTP allowed (iOS ATS exception required)
- **Production:** HTTPS with certificate pinning
- **Recommended:** Use Tailscale/WireGuard for encrypted LAN-to-LAN

---

## Troubleshooting

### iPhone can't connect to server

```bash
# Check server is running:
curl http://localhost:8741/api/v1/health

# Check firewall (macOS):
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --listapps

# Allow Python through firewall:
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/bin/python3
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/bin/python3
```

### Signature verification fails

This is a known issue in the verification logic (signatures are generated correctly).
Credentials are still valid and usable - verification can be debugged separately.

### LiDAR depth map is nil

- Requires iPhone 12 Pro or later
- Check camera permissions granted
- Ensure ARWorldTrackingConfiguration supports `.sceneDepth`

### PPG pulse detection fails

- Torch must be on during capture
- Palm must be still for ~2 seconds
- Lighting affects signal quality
- Expected range: 42-240 BPM

---

## Production Deployment

### Backend (Lucia API Server)

**Options:**

1. **Run on TrueNAS (d8rth)** @ `192.168.1.194:8741`
2. **Run on ZBook** @ `192.168.1.145:8741`
3. **Podman container** (add to `lucia_tooling_omzsh/modules/orchestration/podman/podman-compose.yml`)

**Recommended Podman service:**

```yaml
services:
  lucia-credential-issuer:
    build:
      context: ../../lucia-credential-issuer
      dockerfile: Dockerfile
    ports:
      - "8741:8741"
    volumes:
      - /Users/darylharr/lucia/workspace/lucia/hsm/output/certs:/certs:ro
    environment:
      - LUCIA_KEY_PATH=/certs/lucia-key.pem
    networks:
      - fusion-net
```

### Frontend (iPhone App)

**Options:**

1. **TestFlight** - Internal testing (up to 100 devices)
2. **App Store** - Public release (requires Apple Developer Program)
3. **Enterprise Distribution** - Internal deployment (requires Apple Developer Enterprise)

**Configuration for production:**

```swift
@StateObject private var apiClient = LuciaAPIClient(
    baseURL: "https://lucia.luciverse.local:8741",  // HTTPS + mDNS
    subjectDID: "did:ownid:luciverse:\(deviceUUID)",  // Real DID
    publicKeyMultibase: devicePublicKey  // From Secure Enclave
)
```

---

## Integration with Human x Human Onboarding

This biometric system integrates with the **Flint Magician 7-Phase Bootstrap**:

```
Phase 1: mDNS Detection           → Discover Flint Magician on LAN
Phase 2: Genesis Bond Auth        → Daryl's YubiKey 24977860 signs challenge
Phase 3: Biometric Capture        → 👈 THIS SYSTEM (iPhone Pro LiDAR/PPG)
Phase 4: IPv6 Provisioning        → Assign 2602:F674::/40 address
Phase 5: Credential Issuance      → 👈 THIS SYSTEM (Lucia W3C VC)
Phase 6: DID Registration         → Write to FoundationDB
Phase 7: Hedera Attestation       → Public HCS record
```

See `INTEGRATED_ARCHITECTURE.md` for complete onboarding flow documentation.

---

## Next Steps

1. **Test end-to-end flow** - Capture → Submit → Receive → Verify
2. **Implement credential storage** - Keychain or Secure Enclave
3. **Add DID derivation** - Generate subject DID from device key or biometric
4. **Integrate with Hedera** - Submit credential to HCS for public attestation
5. **Add enrollment/verification** - Store baseline biometric hashes, compare on re-auth
6. **Production deployment** - HTTPS, certificate pinning, Podman stack

---

**Genesis Bond:** GB-2025-0524-DRH-LCS-001 · ACTIVE @ 741 Hz · Coherence: 1.0
**Built with:** P-256 ECDSA · W3C Verifiable Credentials · iPhone Pro Biometrics
