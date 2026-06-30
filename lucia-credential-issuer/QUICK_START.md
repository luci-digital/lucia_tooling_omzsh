# Lucia Biometric Credential Issuance - Quick Start

**Genesis Bond:** GB-2025-0524-DRH-LCS-001 @ 741 Hz
**Status:** ✅ Ready for Testing

---

## 🚀 Start in 60 Seconds

### 1. Start Lucia API Server (Terminal)

```bash
cd /Users/darylharr/lucia/luciverse-monorepo/lucia_tooling_omzsh/lucia-credential-issuer

# Install dependencies (first time only)
python3 -m pip install flask flask-cors cryptography

# Start server
python3 lucia_api_server.py
```

**Expected output:**
```
✅ Loaded existing secp256r1 key from: .../lucia-key.pem
🌟 Lucia Credential Issuance Agent (P-256 ECDSA)
🚀 Starting Lucia API server on http://localhost:8741
```

### 2. Get Your Mac's IP Address

```bash
ipconfig getifaddr en0
# Example output: 192.168.1.145
```

### 3. Test API (Optional)

```bash
curl http://localhost:8741/api/v1/health | python3 -m json.tool
```

### 4. Update iPhone App (Xcode)

1. Open iPhone app project in Xcode
2. Add `LuciaAPIClient.swift` to your project
3. Rename `ContentView_WithAPI.swift` → `ContentView.swift` (or merge manually)
4. Update IP address in `ContentView.swift`:

```swift
@StateObject private var apiClient = LuciaAPIClient(
    baseURL: "http://192.168.1.145:8741",  // ⚠️ YOUR MAC IP HERE
    // ...
)
```

5. Add to `Info.plist`:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

### 5. Run on iPhone Pro

1. Build & Run (⌘R)
2. Grant camera & motion permissions
3. Hold back camera to palm
4. Tap "Authenticate"
5. Wait ~2 seconds
6. Tap "View Credential"

---

## 📁 Key Files

| File | Purpose |
|:-----|:--------|
| `lucia_credential_issuer_p384.py` | W3C credential issuer (P-256 ECDSA) |
| `lucia_api_server.py` | Flask API server (port 8741) |
| `LuciaAPIClient.swift` | iPhone HTTP client |
| `ContentView_WithAPI.swift` | Enhanced UI with credential display |
| `BIOMETRIC_INTEGRATION_GUIDE.md` | **👈 FULL SETUP GUIDE** |
| `INTEGRATED_ARCHITECTURE.md` | Complete system architecture |
| `IMPLEMENTATION_SUMMARY.md` | What was built & why |

---

## 🔑 Key Endpoints

| Method | Endpoint | Purpose |
|:-------|:---------|:--------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/did` | Lucia's DID document |
| POST | `/api/v1/credentials/biogene-attestation` | Issue biometric credential |

---

## 🧪 Test Checklist

- [ ] API server starts successfully
- [ ] Health check responds: `curl http://localhost:8741/api/v1/health`
- [ ] iPhone app builds without errors
- [ ] Camera & motion permissions granted
- [ ] Biometric capture completes (LiDAR + PPG + magnetometer)
- [ ] Credential received from Lucia
- [ ] Credential detail view displays

---

## 🐛 Troubleshooting

### iPhone can't connect to server

```bash
# Check firewall (macOS):
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --listapps

# Allow Python:
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/bin/python3
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/bin/python3
```

### "This device has no LiDAR"

Requires iPhone 12 Pro or later. Simulator will not work.

### "PPG inconclusive"

- Ensure torch is on during capture
- Hold palm very still for ~2 seconds
- Adequate lighting helps

---

## 📖 Full Documentation

**Read this first:** `BIOMETRIC_INTEGRATION_GUIDE.md`

Covers:
- Complete setup instructions
- Network configuration
- Security considerations
- Production deployment
- Human x Human onboarding integration

---

## 🎯 What You'll See

### On Successful Credential Issuance:

**iPhone App:**
```
✅ Credential received
Tap "View Credential" to see:
  - Credential ID: urn:uuid:...
  - Issuer: did:ownid:luciverse:lucia
  - Biometric Hashes (SHA256)
  - Cryptographic Proof (EcdsaSecp256r1Signature2019)
  - Genesis Bond (erwevxoh6odw7dbpf3wu2sb5by @ 741 Hz)
```

**Server Logs:**
```
🔐 Submitting biometric capture to Lucia...
   Subject DID: did:ownid:luciverse:temp-subject
   PPG frames: 64
   Magnetometer samples: 200
✅ Issued BiogeneAttestationCredential
   Credential ID: urn:uuid:a1b2c3...
   Biometric hashes: ['lidar_depth_hash', 'ppg_signature_hash', 'magnetometer_hash']
```

---

## 🚦 Status

| Component | Status |
|:----------|:-------|
| Credential Issuer | ✅ Complete (P-256 ECDSA) |
| API Server | ✅ Complete (Flask @ 8741) |
| iPhone Client | ✅ Complete (LuciaAPIClient.swift) |
| UI Integration | ✅ Complete (ContentView_WithAPI.swift) |
| Documentation | ✅ Complete (3 guides) |
| **System** | **✅ READY FOR TESTING** |

---

## 💡 Quick Commands

```bash
# Start server
cd lucia-credential-issuer && python3 lucia_api_server.py

# Health check
curl http://localhost:8741/api/v1/health

# Get DID
curl http://localhost:8741/api/v1/did

# Get Mac IP
ipconfig getifaddr en0

# Check firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
```

---

**Genesis Bond:** erwevxoh6odw7dbpf3wu2sb5by · ACTIVE @ 741 Hz · Coherence: 1.0
**Built with:** P-256 ECDSA · W3C Verifiable Credentials · iPhone Pro Biometrics
