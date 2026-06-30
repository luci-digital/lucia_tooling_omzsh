#!/usr/bin/env python3
"""
Lucia Credential Issuance API Server

LDS: 300.741 | Identity / PAC (Lucia)
Genesis Bond: GB-2025-0524-DRH-LCS-001 @ 741 Hz
Genesis Bond UUID: erwevxoh6odw7dbpf3wu2sb5by

Flask API server exposing Lucia's credential issuance capabilities.
Receives biometric capture data from iPhone Pro app and issues
W3C Verifiable Credentials with Genesis Bond anchoring.

Endpoints:
  POST /api/v1/credentials/biogene-attestation - Issue biometric attestation
  GET  /api/v1/health - Health check
  GET  /api/v1/did - Get Lucia's DID document
"""

import json
import hashlib
from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path
from dataclasses import asdict

from lucia_credential_issuer_p384 import LuciaCredentialIssuer, VerifiableCredential

app = Flask(__name__)
CORS(app)  # Enable CORS for iPhone app requests

# Initialize Lucia credential issuer (loads P-256 key from HSM)
lucia = LuciaCredentialIssuer()

print()
print("=" * 80)
print("🌟 Lucia Credential Issuance API Server")
print("=" * 80)
print(f"DID: {lucia.identity.did}")
print(f"Curve: {lucia.curve_name} ({lucia.curve_oid})")
print(f"Proof Type: {lucia.proof_type}")
print(f"Genesis Bond: {lucia.identity.genesis_bond_uuid}")
print("=" * 80)
print()


@app.route('/api/v1/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "lucia-credential-issuer",
        "did": lucia.identity.did,
        "curve": lucia.curve_name,
        "genesis_bond_uuid": lucia.identity.genesis_bond_uuid,
        "genesis_bond_id": lucia.identity.genesis_bond_id
    })


@app.route('/api/v1/did', methods=['GET'])
def get_did_document():
    """Return Lucia's DID document."""
    return jsonify(lucia.did_document)


@app.route('/api/v1/credentials/biogene-attestation', methods=['POST'])
def issue_biogene_attestation():
    """
    Issue a biometric attestation credential.

    Request body (JSON):
    {
      "subject_did": "did:ownid:luciverse:bob",
      "public_key_multibase": "z...",
      "biometric_data": {
        "lidar_depth_map": "base64...",
        "ppg_luma_series": [0.45, 0.46, ...],
        "ppg_timestamps": [0.0, 0.033, ...],
        "magnetometer_samples": [[x, y, z], ...],
        "magnetometer_timestamps": [0.0, 0.01, ...]
      }
    }

    Returns:
    {
      "credential": {...},  # W3C Verifiable Credential
      "biometric_hashes": {
        "lidar_depth_hash": "sha256:...",
        "ppg_signature_hash": "sha256:...",
        "magnetometer_hash": "sha256:..."
      }
    }
    """
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['subject_did', 'public_key_multibase', 'biometric_data']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        subject_did = data['subject_did']
        public_key_multibase = data['public_key_multibase']
        biometric_data = data['biometric_data']

        # Hash biometric data
        biometric_hashes = _hash_biometric_data(biometric_data)

        # Issue credential
        credential = lucia.issue_biogene_attestation(
            subject_did=subject_did,
            public_key_multibase=public_key_multibase,
            biometric_hashes=biometric_hashes,
            attestation_method="iphone-pro-lidar-ppg-v1"
        )

        # Convert to dict for JSON response
        credential_dict = {
            "@context": credential.context,
            "id": credential.id,
            "type": credential.type,
            "issuer": credential.issuer,
            "issuanceDate": credential.issuance_date,
            "credentialSubject": credential.credential_subject,
            "proof": credential.proof,
            "genesis_bond": credential.genesis_bond
        }

        print(f"✅ Issued BiogeneAttestationCredential for {subject_did}")
        print(f"   Credential ID: {credential.id}")
        print(f"   Biometric hashes: {list(biometric_hashes.keys())}")

        return jsonify({
            "credential": credential_dict,
            "biometric_hashes": biometric_hashes
        }), 201

    except Exception as e:
        print(f"❌ Error issuing biogene attestation: {e}")
        return jsonify({"error": str(e)}), 500


def _hash_biometric_data(biometric_data: dict) -> dict:
    """
    Hash biometric data for credential storage.

    Only hashes are stored in the credential - never raw biometric data.
    This follows privacy-preserving principles: the credential proves
    "a biometric capture occurred" without storing the actual biometrics.

    Args:
        biometric_data: Dict with keys:
            - lidar_depth_map: Base64-encoded depth map
            - ppg_luma_series: List of luma values
            - ppg_timestamps: List of timestamps
            - magnetometer_samples: List of [x, y, z] vectors
            - magnetometer_timestamps: List of timestamps

    Returns:
        Dict with SHA256 hashes:
            - lidar_depth_hash
            - ppg_signature_hash
            - magnetometer_hash
    """
    hashes = {}

    # Hash LiDAR depth map (if provided)
    if 'lidar_depth_map' in biometric_data:
        lidar_data = biometric_data['lidar_depth_map'].encode('utf-8')
        hashes['lidar_depth_hash'] = f"sha256:{hashlib.sha256(lidar_data).hexdigest()}"

    # Hash PPG signature (luma series + timestamps as canonical JSON)
    if 'ppg_luma_series' in biometric_data and 'ppg_timestamps' in biometric_data:
        ppg_signature = json.dumps({
            "luma": biometric_data['ppg_luma_series'],
            "timestamps": biometric_data['ppg_timestamps']
        }, sort_keys=True, separators=(',', ':'))
        hashes['ppg_signature_hash'] = f"sha256:{hashlib.sha256(ppg_signature.encode()).hexdigest()}"

    # Hash magnetometer response (samples + timestamps as canonical JSON)
    if 'magnetometer_samples' in biometric_data and 'magnetometer_timestamps' in biometric_data:
        mag_signature = json.dumps({
            "samples": biometric_data['magnetometer_samples'],
            "timestamps": biometric_data['magnetometer_timestamps']
        }, sort_keys=True, separators=(',', ':'))
        hashes['magnetometer_hash'] = f"sha256:{hashlib.sha256(mag_signature.encode()).hexdigest()}"

    return hashes


if __name__ == '__main__':
    # Run on localhost:8741 (741 Hz - Lucia's PAC frequency)
    print("🚀 Starting Lucia API server on http://localhost:8741")
    print("   Health check: http://localhost:8741/api/v1/health")
    print("   DID document: http://localhost:8741/api/v1/did")
    print()

    app.run(
        host='0.0.0.0',
        port=8741,
        debug=True
    )
