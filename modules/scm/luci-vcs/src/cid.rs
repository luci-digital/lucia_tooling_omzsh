// Real CIDv1 encoding for BLAKE3 block addresses (replaces the "bafk-blake3-<hex>" placeholder).
// LDS: 700.528 | IPv6: 2602:F674:0000:0700::528 | 528 Hz
//
// A CIDv1 is   multibase("b", base32-lower-nopad( varint(1) ‖ varint(codec) ‖ varint(0x1e) ‖ varint(32) ‖ digest ))
// with codec 0x55 (raw) for block bytes. This matches kubo `ipfs add --cid-version 1 --raw-leaves --hash blake3`
// and lucidag's luci_blobstore `cid` for single-block content: raw(blake3("abc")) =
// bafkr4ideg6z2yocgkez77nr3outtvdnvjdcvqrs5phnqh7jvtrwnlpm5qu.
//
// Hand-written on purpose: the `cid` crate (and its proc-macro dependency) is NEEDS-SIGNATURE on the LuciVerse crate
// shelf. Once signed, the `ipfs` feature can cross-check this module against `cid::Cid`.
//
// Accepted reference spellings (parse_ref): a real CIDv1 with a 32-byte BLAKE3 multihash (any codec), the legacy
// "bafk-blake3-<64 hex>" placeholder that older workflow files still carry, and a bare 64-hex BLAKE3 address.

/// Multicodec: raw binary.
pub const RAW: u64 = 0x55;
/// Multicodec: json (plain, non-canonical JSON bytes).
pub const JSON: u64 = 0x0200;
/// Multihash: BLAKE3 (32-byte digest).
pub const BLAKE3: u64 = 0x1e;

const B32: &[u8; 32] = b"abcdefghijklmnopqrstuvwxyz234567";
const LEGACY_PREFIX: &str = "bafk-blake3-";

fn put_varint(mut v: u64, out: &mut Vec<u8>) {
    while v >= 0x80 {
        out.push((v as u8 & 0x7f) | 0x80);
        v >>= 7;
    }
    out.push(v as u8);
}

fn get_varint(bytes: &[u8], pos: &mut usize) -> Option<u64> {
    let mut v: u64 = 0;
    for shift in (0..64).step_by(7) {
        let b = *bytes.get(*pos)?;
        *pos += 1;
        v |= u64::from(b & 0x7f) << shift;
        if b & 0x80 == 0 {
            return Some(v);
        }
    }
    None
}

fn base32_encode(bytes: &[u8]) -> String {
    let mut out = String::with_capacity(bytes.len() * 8 / 5 + 1);
    let (mut buf, mut bits) = (0u32, 0u32);
    for &b in bytes {
        buf = (buf << 8) | u32::from(b);
        bits += 8;
        while bits >= 5 {
            bits -= 5;
            out.push(B32[((buf >> bits) & 31) as usize] as char);
        }
    }
    if bits > 0 {
        out.push(B32[((buf << (5 - bits)) & 31) as usize] as char);
    }
    out
}

fn base32_decode(s: &str) -> Option<Vec<u8>> {
    let mut out = Vec::with_capacity(s.len() * 5 / 8);
    let (mut buf, mut bits) = (0u32, 0u32);
    for c in s.bytes() {
        let v = B32.iter().position(|&a| a == c)? as u32;
        buf = (buf << 5) | v;
        bits += 5;
        if bits >= 8 {
            bits -= 8;
            out.push((buf >> bits) as u8);
        }
    }
    // Leftover bits must be zero padding (canonical encoding only).
    if bits >= 5 || (buf & ((1 << bits) - 1)) != 0 {
        return None;
    }
    Some(out)
}

/// CIDv1 string for a 32-byte BLAKE3 digest under the given multicodec.
pub fn cid_v1_blake3(codec: u64, digest: &[u8; 32]) -> String {
    let mut bytes = Vec::with_capacity(36);
    put_varint(1, &mut bytes);
    put_varint(codec, &mut bytes);
    put_varint(BLAKE3, &mut bytes);
    put_varint(32, &mut bytes);
    bytes.extend_from_slice(digest);
    format!("b{}", base32_encode(&bytes))
}

/// Decode a base32 CIDv1 whose multihash is a 32-byte BLAKE3 digest. Returns (codec, digest).
/// Anything else (CIDv0, other hashes, other multibases, trailing bytes) is None.
pub fn decode_cid_v1_blake3(s: &str) -> Option<(u64, [u8; 32])> {
    let bytes = base32_decode(s.strip_prefix('b')?)?;
    let mut pos = 0;
    if get_varint(&bytes, &mut pos)? != 1 {
        return None;
    }
    let codec = get_varint(&bytes, &mut pos)?;
    if get_varint(&bytes, &mut pos)? != BLAKE3 || get_varint(&bytes, &mut pos)? != 32 {
        return None;
    }
    let digest: [u8; 32] = bytes.get(pos..)?.try_into().ok()?;
    Some((codec, digest))
}

fn hex32(s: &str) -> Option<[u8; 32]> {
    if s.len() != 64 {
        return None;
    }
    let mut out = [0u8; 32];
    for (i, chunk) in s.as_bytes().chunks(2).enumerate() {
        out[i] = u8::from_str_radix(std::str::from_utf8(chunk).ok()?, 16).ok()?;
    }
    Some(out)
}

/// Resolve any accepted reference spelling to the 32-byte BLAKE3 address it names.
pub fn parse_ref(s: &str) -> Option<[u8; 32]> {
    if let Some(hex) = s.strip_prefix(LEGACY_PREFIX) {
        return hex32(hex);
    }
    if let Some(d) = hex32(s) {
        return Some(d);
    }
    decode_cid_v1_blake3(s).map(|(_, d)| d)
}

#[cfg(test)]
mod tests {
    use super::*;

    const ABC_RAW: &str = "bafkr4ideg6z2yocgkez77nr3outtvdnvjdcvqrs5phnqh7jvtrwnlpm5qu";

    #[test]
    fn golden_vector_matches_kubo_and_blobstore() {
        let d = *blake3::hash(b"abc").as_bytes();
        assert_eq!(cid_v1_blake3(RAW, &d), ABC_RAW);
    }

    #[test]
    fn decode_roundtrip_raw_and_json() {
        let d = *blake3::hash(b"abc").as_bytes();
        assert_eq!(decode_cid_v1_blake3(ABC_RAW), Some((RAW, d)));
        let j = cid_v1_blake3(JSON, &d); // two-byte codec varint
        assert_eq!(decode_cid_v1_blake3(&j), Some((JSON, d)));
    }

    #[test]
    fn parse_ref_accepts_all_three_spellings() {
        let d = *blake3::hash(b"abc").as_bytes();
        let hex = hex::encode(d);
        assert_eq!(parse_ref(ABC_RAW), Some(d));
        assert_eq!(parse_ref(&format!("bafk-blake3-{hex}")), Some(d));
        assert_eq!(parse_ref(&hex), Some(d));
    }

    #[test]
    fn parse_ref_rejects_non_blake3_and_garbage() {
        // CIDv1 raw + sha2-256 (kubo default) is a different digest: not a BLAKE3 address.
        assert_eq!(parse_ref("bafkreif2pall7dybz7vecqka3zo24irdwabwdi4wc55jznaq75q7eaavvu"), None);
        assert_eq!(parse_ref("bafk-blake3-deadbeef"), None);
        assert_eq!(parse_ref("cid:1"), None);
        assert_eq!(parse_ref(""), None);
        let mut bad = ABC_RAW.to_string();
        bad.push('a'); // trailing data
        assert_eq!(parse_ref(&bad), None);
    }
}
