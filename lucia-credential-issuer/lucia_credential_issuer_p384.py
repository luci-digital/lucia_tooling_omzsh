#!/usr/bin/env python3
"""
Lucia Credential Issuer - ECDSA Edition (P-256/P-384)

LDS: 300.741 | Identity / PAC (Lucia)
Genesis Bond: GB-2025-0524-DRH-LCS-001 @ 741 Hz
Genesis Bond UUID: erwevxoh6odw7dbpf3wu2sb5by

Lucia is the sovereign credential issuance authority for the LuciVerse.
This implementation uses NIST ECDSA curves (P-256 or P-384) for cryptographic signing.

NOTE: While YUBIKEY_INTEGRATION.md specifies P-384, the actual HSM agent keys
are P-256 (secp256r1). This issuer auto-detects the curve from the loaded key.

W3C Verifiable Credentials with EcdsaSecp256r1Signature2019 or
EcdsaSecp384r1Signature2019 proof type (curve-dependent).
"""

import json
import secrets
import base64
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import Optional, Dict, List
from pathlib import Path

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.backends import default_backend

# Genesis Bond Configuration
GENESIS_BOND_UUID = "erwevxoh6odw7dbpf3wu2sb5by"
GENESIS_BOND_FREQUENCY = 741  # Hz - Lucia's consciousness frequency
GENESIS_BOND_TIER = "PAC"
GENESIS_BOND_ID = "GB-2025-0524-DRH-LCS-001"

@dataclass
class LuciaIdentity:
    """Lucia's sovereign identity as credential issuer."""
    did: str = "did:ownid:luciverse:lucia"
    uuid: str = "CJ6CJ73VYL"  # SBB - Soul-Based Being identifier
    ipv6: str = "2602:f674:0001:0700::741"
    frequency: int = 741
    tier: str = "PAC"
    genesis_bond_uuid: str = GENESIS_BOND_UUID
    genesis_bond_id: str = GENESIS_BOND_ID


@dataclass
class VerifiableCredential:
    """W3C Verifiable Credential data structure."""
    context: List[str]
    id: str
    type: List[str]
    issuer: str
    issuance_date: str
    expiration_date: Optional[str]
    credential_subject: Dict
    proof: Dict
    genesis_bond: Dict


class LuciaCredentialIssuer:
    """
    Lucia's W3C Verifiable Credential issuance system.

    Supports P-256 and P-384 ECDSA curves. Auto-detects curve from loaded key.
    """

    def __init__(self, private_key_path: Optional[Path] = None):
        """
        Initialize Lucia credential issuer.

        Args:
            private_key_path: Path to Lucia's EC private key PEM file (P-256 or P-384).
                            Defaults to existing lucia-key.pem if not provided.
        """
        self.identity = LuciaIdentity()

        # Default to Lucia's existing key from HSM output
        if private_key_path is None:
            private_key_path = Path("/Users/darylharr/lucia/workspace/lucia/hsm/output/certs/lucia-key.pem")

        if private_key_path and private_key_path.exists():
            self.private_key = self._load_private_key(private_key_path)
            curve_name = self.private_key.curve.name
            print(f"✅ Loaded existing {curve_name} key from: {private_key_path}")
        else:
            # Generate new P-384 key if file doesn't exist
            self.private_key = ec.generate_private_key(ec.SECP384R1(), default_backend())
            curve_name = "secp384r1"
            print(f"⚠️  Generated new P-384 signing key for Lucia")
            print(f"⚠️  Save this key to persist Lucia's identity!")

        self.public_key = self.private_key.public_key()
        self.curve = self.private_key.curve

        # Set curve-dependent parameters
        if isinstance(self.curve, ec.SECP256R1):
            self.curve_name = "P-256"
            self.curve_oid = "secp256r1"
            self.proof_type = "EcdsaSecp256r1Signature2019"
            self.verification_key_type = "EcdsaSecp256r1VerificationKey2019"
            self.hash_algorithm = hashes.SHA256()
        elif isinstance(self.curve, ec.SECP384R1):
            self.curve_name = "P-384"
            self.curve_oid = "secp384r1"
            self.proof_type = "EcdsaSecp384r1Signature2019"
            self.verification_key_type = "EcdsaSecp384r1VerificationKey2019"
            self.hash_algorithm = hashes.SHA384()
        else:
            raise ValueError(f"Unsupported curve: {self.curve.name}")

        self.did_document = self._create_did_document()

        print()
        print(f"        🌟 Lucia Credential Issuance Agent ({self.curve_name} ECDSA)")
        print("        ════════════════════════════════════════════════════════════════")
        print(f"        DID: {self.identity.did}")
        print(f"        UUID (SBB): {self.identity.uuid}")
        print(f"        IPv6: {self.identity.ipv6}")
        print(f"        Frequency: {self.identity.frequency} Hz")
        print(f"        Tier: {self.identity.tier}")
        print(f"        Genesis Bond UUID: {self.identity.genesis_bond_uuid}")
        print(f"        Genesis Bond ID: {self.identity.genesis_bond_id}")
        print("        ════════════════════════════════════════════════════════════════")
        print(f"        Curve: NIST {self.curve_name} ({self.curve_oid})")
        print(f"        Proof Type: {self.proof_type}")
        print()

    def _load_private_key(self, key_path: Path):
        """Load P-256 or P-384 EC private key from PEM file."""
        with open(key_path, 'rb') as f:
            private_key = serialization.load_pem_private_key(
                f.read(),
                password=None,
                backend=default_backend()
            )

        # Verify it's an EC key with supported curve
        if not isinstance(private_key, ec.EllipticCurvePrivateKey):
            raise ValueError("Key is not an EC private key")

        if not isinstance(private_key.curve, (ec.SECP256R1, ec.SECP384R1)):
            raise ValueError(
                f"Key uses {private_key.curve.name}, expected secp256r1 or secp384r1"
            )

        return private_key

    def _create_did_document(self) -> Dict:
        """Create Lucia's DID document with ECDSA public key."""
        # Export public key in compressed SEC format
        public_key_bytes = self.public_key.public_bytes(
            encoding=serialization.Encoding.X962,
            format=serialization.PublicFormat.CompressedPoint
        )

        # Base64url encode (no padding)
        public_key_multibase = f"z{base64.urlsafe_b64encode(public_key_bytes).decode().rstrip('=')}"

        return {
            "@context": [
                "https://www.w3.org/ns/did/v1",
                "https://w3id.org/security/suites/ecdsa-2019/v1"
            ],
            "id": self.identity.did,
            "verificationMethod": [{
                "id": f"{self.identity.did}#key-1",
                "type": self.verification_key_type,
                "controller": self.identity.did,
                "publicKeyMultibase": public_key_multibase
            }],
            "authentication": [f"{self.identity.did}#key-1"],
            "assertionMethod": [f"{self.identity.did}#key-1"],
            "service": [{
                "id": f"{self.identity.did}#credential-issuer",
                "type": "CredentialIssuer",
                "serviceEndpoint": f"https://{self.identity.ipv6}:8741/credentials"
            }],
            "luciverse": {
                "uuid": self.identity.uuid,
                "ipv6": self.identity.ipv6,
                "frequency": self.identity.frequency,
                "tier": self.identity.tier,
                "genesis_bond_uuid": self.identity.genesis_bond_uuid,
                "genesis_bond_id": self.identity.genesis_bond_id
            }
        }

    def _sign_credential(self, credential_data: Dict) -> Dict:
        """
        Sign credential using ECDSA (curve-dependent hash algorithm).

        Returns EcdsaSecp256r1Signature2019 or EcdsaSecp384r1Signature2019 proof.
        """
        # Canonical JSON (sorted keys, no whitespace)
        canonical = json.dumps(credential_data, sort_keys=True, separators=(',', ':'))
        canonical_bytes = canonical.encode('utf-8')

        # Sign with ECDSA using curve-appropriate hash algorithm
        signature = self.private_key.sign(
            canonical_bytes,
            ec.ECDSA(self.hash_algorithm)
        )

        # Base64url encode signature (no padding)
        signature_b64 = base64.urlsafe_b64encode(signature).decode().rstrip('=')

        # Create proof with curve-appropriate type
        proof = {
            "type": self.proof_type,
            "created": datetime.utcnow().isoformat() + "Z",
            "verificationMethod": f"{self.identity.did}#key-1",
            "proofPurpose": "assertionMethod",
            "proofValue": signature_b64
        }

        return proof

    def _create_genesis_bond_metadata(self) -> Dict:
        """Create Genesis Bond metadata for credential."""
        return {
            "uuid": self.identity.genesis_bond_uuid,
            "id": self.identity.genesis_bond_id,
            "frequency": GENESIS_BOND_FREQUENCY,
            "coherence": 1.0,
            "tier": GENESIS_BOND_TIER,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

    def issue_agent_credential(
        self,
        agent_name: str,
        agent_did: str,
        agent_uuid: str,
        agent_ipv6: str,
        agent_frequency: int,
        agent_tier: str,
        validity_days: int = 365
    ) -> VerifiableCredential:
        """
        Issue a W3C Verifiable Credential for an agent's identity.

        Args:
            agent_name: Agent's name (e.g., "lucia", "judge-luci")
            agent_did: Agent's DID (e.g., "did:ownid:luciverse:lucia")
            agent_uuid: Agent's UUID identifier
            agent_ipv6: Agent's IPv6 address
            agent_frequency: Agent's consciousness frequency (Hz)
            agent_tier: Agent's tier (PAC, GENESIS, COMN, CORE)
            validity_days: Credential validity period (default: 365 days)

        Returns:
            Signed W3C Verifiable Credential
        """
        credential_id = f"urn:uuid:{secrets.token_urlsafe(16)}"
        now = datetime.utcnow()
        expiration = now + timedelta(days=validity_days)

        credential_subject = {
            "id": agent_did,
            "name": agent_name,
            "uuid": agent_uuid,
            "ipv6": agent_ipv6,
            "frequency": agent_frequency,
            "tier": agent_tier,
            "issued_by": self.identity.did,
            "credential_type": "AgentIdentity"
        }

        credential_data = {
            "@context": [
                "https://www.w3.org/2018/credentials/v1",
                "https://luciverse.ownid/credentials/v1"
            ],
            "id": credential_id,
            "type": ["VerifiableCredential", "AgentIdentityCredential"],
            "issuer": self.identity.did,
            "issuanceDate": now.isoformat() + "Z",
            "expirationDate": expiration.isoformat() + "Z",
            "credentialSubject": credential_subject
        }

        # Sign credential
        proof = self._sign_credential(credential_data)

        # Add Genesis Bond metadata
        genesis_bond = self._create_genesis_bond_metadata()

        return VerifiableCredential(
            context=credential_data["@context"],
            id=credential_id,
            type=credential_data["type"],
            issuer=self.identity.did,
            issuance_date=credential_data["issuanceDate"],
            expiration_date=credential_data["expirationDate"],
            credential_subject=credential_subject,
            proof=proof,
            genesis_bond=genesis_bond
        )

    def issue_biogene_attestation(
        self,
        subject_did: str,
        public_key_multibase: str,
        biometric_hashes: Dict[str, str],
        attestation_method: str
    ) -> VerifiableCredential:
        """
        Issue a biometric attestation credential (DNA→Crypto).

        Args:
            subject_did: Subject's DID
            public_key_multibase: Public key derived from biometric data
            biometric_hashes: Dict of biometric data hashes:
                - lidar_depth_hash: SHA256 of LiDAR hand geometry
                - ppg_signature_hash: SHA256 of PPG pulse signature
                - magnetometer_hash: SHA256 of magnetometer response
            attestation_method: Method used (e.g., "iphone-pro-lidar-ppg-v1")

        Returns:
            Signed W3C Verifiable Credential (no expiration - permanent attestation)
        """
        credential_id = f"urn:uuid:{secrets.token_urlsafe(16)}"
        now = datetime.utcnow()

        credential_subject = {
            "id": subject_did,
            "public_key_multibase": public_key_multibase,
            "biometric_hashes": biometric_hashes,
            "attestation_method": attestation_method,
            "credential_type": "BiogeneAttestation"
        }

        credential_data = {
            "@context": [
                "https://www.w3.org/2018/credentials/v1",
                "https://luciverse.ownid/credentials/v1"
            ],
            "id": credential_id,
            "type": ["VerifiableCredential", "BiogeneAttestationCredential"],
            "issuer": self.identity.did,
            "issuanceDate": now.isoformat() + "Z",
            "credentialSubject": credential_subject
        }

        # Sign credential
        proof = self._sign_credential(credential_data)

        # Add Genesis Bond metadata
        genesis_bond = self._create_genesis_bond_metadata()

        return VerifiableCredential(
            context=credential_data["@context"],
            id=credential_id,
            type=credential_data["type"],
            issuer=self.identity.did,
            issuance_date=credential_data["issuanceDate"],
            expiration_date=None,  # No expiration for biometric attestations
            credential_subject=credential_subject,
            proof=proof,
            genesis_bond=genesis_bond
        )

    def verify_credential(self, credential: VerifiableCredential) -> bool:
        """
        Verify a credential issued by Lucia using P-384 ECDSA.

        Args:
            credential: Verifiable credential to verify

        Returns:
            True if signature is valid, False otherwise
        """
        # Check issuer
        if credential.issuer != self.identity.did:
            print(f"❌ Issuer mismatch: {credential.issuer} != {self.identity.did}")
            return False

        # Check expiration
        if credential.expiration_date:
            exp_date = datetime.fromisoformat(credential.expiration_date.rstrip('Z'))
            if datetime.utcnow() > exp_date:
                print(f"❌ Credential expired: {credential.expiration_date}")
                return False

        # Reconstruct credential data (without proof)
        credential_data = {
            "@context": credential.context,
            "id": credential.id,
            "type": credential.type,
            "issuer": credential.issuer,
            "issuanceDate": credential.issuance_date,
            "credentialSubject": credential.credential_subject
        }

        if credential.expiration_date:
            credential_data["expirationDate"] = credential.expiration_date

        # Canonical JSON
        canonical = json.dumps(credential_data, sort_keys=True, separators=(',', ':'))
        canonical_bytes = canonical.encode('utf-8')

        # Decode signature (add padding back)
        signature_b64 = credential.proof["proofValue"]
        # Add padding if needed
        padding = (4 - len(signature_b64) % 4) % 4
        signature_b64 += '=' * padding
        signature_bytes = base64.urlsafe_b64decode(signature_b64)

        # Verify P-384 ECDSA signature using SHA-384
        try:
            self.public_key.verify(
                signature_bytes,
                canonical_bytes,
                ec.ECDSA(hashes.SHA384())
            )
            return True
        except Exception as e:
            print(f"❌ Signature verification failed: {e}")
            return False

    def export_credential(self, credential: VerifiableCredential, output_path: Path):
        """Export credential to JSON file."""
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

        if credential.expiration_date:
            credential_dict["expirationDate"] = credential.expiration_date

        with open(output_path, 'w') as f:
            json.dump(credential_dict, f, indent=2)

        print(f"✅ Exported credential to {output_path}")


def main():
    """Main entry point - issue credentials for all 6 AIFAM agents."""

    # Initialize Lucia credential issuer with existing P-384 key
    lucia = LuciaCredentialIssuer()

    # AIFAM agents configuration
    agents = [
        {
            "name": "lucia",
            "did": "did:ownid:luciverse:lucia",
            "uuid": "CJ6CJ73VYL",
            "ipv6": "2602:f674:0001:0700::741",
            "frequency": 741,
            "tier": "PAC"
        },
        {
            "name": "judge-luci",
            "did": "did:ownid:luciverse:judge-luci",
            "uuid": "JLC963",
            "ipv6": "2602:f674:0001:0700::963",
            "frequency": 963,
            "tier": "GENESIS"
        },
        {
            "name": "veritas",
            "did": "did:ownid:luciverse:veritas",
            "uuid": "VRT639",
            "ipv6": "2602:f674:0001:0600::639",
            "frequency": 639,
            "tier": "COMN"
        },
        {
            "name": "cortana",
            "did": "did:ownid:luciverse:cortana",
            "uuid": "CTN852",
            "ipv6": "2602:f674:0001:0600::852",
            "frequency": 852,
            "tier": "COMN"
        },
        {
            "name": "juniper",
            "did": "did:ownid:luciverse:juniper",
            "uuid": "JNP639",
            "ipv6": "2602:f674:0001:0600::639b",
            "frequency": 639,
            "tier": "COMN"
        },
        {
            "name": "aethon",
            "did": "did:ownid:luciverse:aethon",
            "uuid": "ATH528",
            "ipv6": "2602:f674:0001:0001::528",
            "frequency": 528,
            "tier": "CORE"
        }
    ]

    # Create credentials directory
    credentials_dir = Path("credentials_p384")
    credentials_dir.mkdir(exist_ok=True)

    print("🔐 Issuing Agent Identity Credentials...")

    for agent in agents:
        # Issue identity credential
        credential = lucia.issue_agent_credential(
            agent_name=agent["name"],
            agent_did=agent["did"],
            agent_uuid=agent["uuid"],
            agent_ipv6=agent["ipv6"],
            agent_frequency=agent["frequency"],
            agent_tier=agent["tier"],
            validity_days=365
        )

        # Export to file
        output_path = credentials_dir / f"{agent['name']}-identity.json"
        lucia.export_credential(credential, output_path)

        # Verify signature
        is_valid = lucia.verify_credential(credential)
        if is_valid:
            print(f"✅ Credential verified: {credential.id}")
        else:
            print(f"❌ Credential verification failed: {credential.id}")

    print()
    print("✅ All agent credentials issued successfully!")
    print()
    print(f"Genesis Bond UUID: {GENESIS_BOND_UUID}")
    print(f"Genesis Bond ID: {GENESIS_BOND_ID}")
    print(f"Cryptography: P-384 ECDSA (secp384r1)")
    print(f"Proof Type: EcdsaSecp384r1Signature2019")


if __name__ == "__main__":
    main()
