# Visual Relationship Network - Security Documentation

## 🔒 Security Overview

This application implements **military-grade end-to-end encryption** with a **zero-knowledge, trust-nobody architecture**. Your relationship network data is encrypted before it ever leaves your browser's memory.

### Core Security Principles

✅ **End-to-End Encryption**: Data is encrypted in your browser before saving  
✅ **Zero-Knowledge**: We cannot access your data—we don't even have your files  
✅ **Local-Only Storage**: Files are stored on YOUR computer, not in the cloud  
✅ **No Network Transmission**: Zero data sent to servers (this app has no backend)  
✅ **No Analytics or Tracking**: Completely private, no telemetry  
✅ **Open Cryptography**: Industry-standard algorithms (AES-256-GCM, PBKDF2)

---

## 🛡️ How Your Data is Protected

### Encryption Specification

**Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Size**: 256 bits (unbreakable with current technology)
- **Authentication**: Built-in integrity verification prevents tampering
- **IV**: Unique 12-byte random initialization vector per file

**Key Derivation**: PBKDF2 with SHA-256
- **Iterations**: 100,000 (makes brute-force attacks extremely slow)
- **Salt**: Random 16-byte salt per file (prevents rainbow table attacks)
- **Output**: 256-bit encryption key derived from your password

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  YOUR BROWSER (Trusted Environment)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Create/Edit Network → Plaintext in Memory              │
│                                ↓                            │
│  2. Click Save → Encryption Function                        │
│                                ↓                            │
│  3. Password + Data → AES-256-GCM Encryption               │
│                                ↓                            │
│  4. Encrypted Blob (.enc.json) → Download to YOUR Computer │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────┐
│  YOUR COMPUTER (Local Disk)                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Encrypted File: network.enc.json                          │
│  {                                                          │
│    "iv": "random12ByteIV...",                              │
│    "salt": "random16ByteSalt...",                          │
│    "data": "encryptedCiphertext..."  ← UNREADABLE         │
│  }                                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────┐
│  LOADING (Decryption)                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Select File → Read Encrypted Data                      │
│  2. Enter Password → Key Derivation (PBKDF2)               │
│  3. Decrypt in Browser → Plaintext in Memory               │
│  4. Display/Edit Network                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### What Gets Encrypted

**Everything in your workspace**:
- ✅ Person names, positions, metadata
- ✅ Relationship connections
- ✅ Group memberships and labels
- ✅ Node positions and colors
- ✅ All custom data fields

**What is NOT encrypted** (metadata only):
- File format version (for compatibility)
- Encryption parameters (IV, salt—required for decryption)

---

## 🔐 Trust Model: Who Can Access Your Data?

| Entity | Can Access Your Data? | Why/Why Not |
|--------|----------------------|-------------|
| **You** (with password) | ✅ YES | You have the password and the encrypted file |
| **Application developers** | ❌ NO | We never see your files—they're on YOUR computer |
| **Hackers with your file** | ❌ NO | File is encrypted; useless without password |
| **Cloud providers** | ❌ NO | No cloud storage; files never uploaded |
| **Government agencies** | ❌ NO | No backdoor, no master key, no access possible |
| **Browser extensions** | ⚠️ MAYBE | Malicious extensions COULD read browser memory |
| **Malware on your computer** | ⚠️ MAYBE | Keyloggers or memory dumps could steal password |
| **Someone with physical access to your unlocked computer** | ⚠️ MAYBE | Could access decrypted data while app is open |

### What This Means

✅ **At Rest (Saved Files)**: Your data is ALWAYS encrypted  
✅ **In Transit**: No transit—files never leave your computer  
⚠️ **In Use (While App is Open)**: Data is decrypted in browser memory to allow editing

This is the **same security model** as industry leaders like:
- 1Password (password manager)
- Bitwarden (password manager)
- Standard Notes (encrypted notes)
- Signal Desktop (when viewing messages)

---

## 🚨 Critical Security Warnings

### ⚠️ Password Loss = Data Loss

**There is NO password recovery**. This is by design (zero-knowledge).

If you lose your password:
- ❌ We cannot reset it (we don't have your data)
- ❌ We cannot decrypt it (no backdoor exists)
- ❌ Your data is permanently inaccessible

**Recommendation**: Use a password manager like Bitwarden or 1Password to store your network password securely.

### 🔑 Password Strength Matters

**Your password is the ONLY thing protecting your data.**

Weak password examples (❌ DON'T USE):
- `password`, `123456`, `network`
- Dictionary words: `relationship`, `friends`
- Personal info: Your name, birthdate, etc.

Strong password examples (✅ USE):
- `Tr0pic@l-Flamingo-2024!` (passphrase with substitutions)
- Random: `X9#mK2$pL7&nQ3@w` (use a password manager)
- Length matters: Longer = stronger (aim for 12+ characters)

### 🖥️ Your Computer's Security

This application is **only as secure as your computer**.

Threats we CANNOT protect against:
- ❌ Keyloggers recording your password
- ❌ Screen recording software
- ❌ Memory dumps from malware
- ❌ Physical access to your unlocked device

**Your responsibility**:
- Keep your OS and browser updated
- Use antivirus/anti-malware software
- Don't use public/shared computers for sensitive networks
- Lock your computer when stepping away
- Use full-disk encryption (BitLocker, FileVault)

---

## 🎯 Attack Resistance

### Attacks We're Protected Against

| Attack Type | Protection | Effectiveness |
|-------------|------------|---------------|
| **File theft** | AES-256-GCM encryption | ✅ EXCELLENT - Unbreakable |
| **Brute force** | PBKDF2 100k iterations | ✅ GOOD - Billions of years for strong passwords |
| **Rainbow tables** | Unique random salt per file | ✅ EXCELLENT - Precomputation useless |
| **Man-in-the-middle** | No network transmission | ✅ PERFECT - No network = no MITM |
| **Server compromise** | No server exists | ✅ PERFECT - Can't compromise what doesn't exist |
| **Cloud provider access** | No cloud storage | ✅ PERFECT - Files never uploaded |
| **File tampering** | GCM authentication tag | ✅ EXCELLENT - Tampered files fail to decrypt |
| **Weak encryption** | 256-bit AES (industry standard) | ✅ EXCELLENT - NSA-approved for TOP SECRET |

### Attacks We're NOT Protected Against

| Attack Type | Risk Level | Your Responsibility |
|-------------|-----------|---------------------|
| **Weak password** | 🔴 HIGH | Choose strong, unique passwords |
| **Password reuse** | 🔴 HIGH | Don't reuse passwords across services |
| **Keylogger malware** | 🟡 MEDIUM | Keep antivirus updated, avoid suspicious downloads |
| **Phishing** | 🟡 MEDIUM | This is a local app—no logins, no emails, no links |
| **Physical access** | 🟡 MEDIUM | Lock your computer, use full-disk encryption |
| **Browser exploits** | 🟢 LOW | Keep browser updated |

---

## 🧪 Cryptographic Details (For Security Auditors)

### Encryption Process

```typescript
// 1. Generate random salt and IV
salt = crypto.getRandomValues(16 bytes)
iv = crypto.getRandomValues(12 bytes)

// 2. Derive encryption key from password
key = PBKDF2(
  password: user_password,
  salt: salt,
  iterations: 100000,
  hash: SHA-256,
  outputLength: 256 bits
)

// 3. Encrypt data with AES-256-GCM
ciphertext = AES-GCM-Encrypt(
  plaintext: JSON.stringify(workspace),
  key: key,
  iv: iv,
  tagLength: 128 bits
)

// 4. Output format
output = {
  iv: Base64(iv),
  salt: Base64(salt),
  data: Base64(ciphertext || authentication_tag)
}
```

### Decryption Process

```typescript
// 1. Parse encrypted file
{iv, salt, data} = JSON.parse(encryptedFile)

// 2. Derive key from password (same process as encryption)
key = PBKDF2(password, salt, 100000, SHA-256, 256)

// 3. Decrypt and verify authentication tag
plaintext = AES-GCM-Decrypt(
  ciphertext: Base64Decode(data),
  key: key,
  iv: Base64Decode(iv)
)
// If authentication tag doesn't match → throws error (wrong password or tampered file)

// 4. Parse decrypted data
workspace = JSON.parse(plaintext)
```

### Standards Compliance

- **NIST SP 800-38D**: AES-GCM authenticated encryption
- **NIST SP 800-132**: PBKDF2 key derivation
- **FIPS 197**: AES encryption standard
- **RFC 5116**: Authenticated Encryption specification

### Known Limitations

1. **No perfect forward secrecy**: Same password decrypts all versions of the file
   - **Mitigation**: Change password periodically, use unique passwords
   
2. **No key rotation**: Encryption key tied to password
   - **Mitigation**: Re-encrypt with new password to rotate keys
   
3. **Password strength dependent**: Security only as strong as user's password
   - **Mitigation**: Enforce strong passwords, show strength indicator

---

## 📋 Security Checklist for Users

Before trusting this application with sensitive data, ensure:

- [ ] You understand that lost passwords cannot be recovered
- [ ] You're using a strong, unique password (12+ characters)
- [ ] You've saved your password in a secure password manager
- [ ] You understand your files are stored locally (not in cloud)
- [ ] You're keeping backups of your `.enc.json` files
- [ ] Your computer has up-to-date antivirus software
- [ ] You're using a modern, updated browser
- [ ] You're aware that data is decrypted in memory while editing
- [ ] You won't use this on shared/public computers

---

## 🤝 Trust, But Verify

**Don't trust us—verify the code yourself!**

This is open-source software. The encryption implementation is in:
- `src/lib/encryption.ts` - Core crypto functions
- Web Crypto API (built into your browser) - Actual encryption

**How to audit**:
1. Open browser DevTools (F12)
2. Go to Sources tab
3. Find `encryption.ts`
4. Review the code
5. Verify we're using Web Crypto API (native, audited)
6. Check network tab—confirm ZERO network requests for your data

---

## 🆘 FAQ

### Q: Can you recover my password?
**A**: No. This is zero-knowledge encryption—we never see your password or files.

### Q: Is my data stored in the cloud?
**A**: No. Files are saved to YOUR computer only. We have no cloud storage.

### Q: Can government agencies access my data?
**A**: No. We have no backdoor, no master key, and no access to your files.

### Q: What if I forget my password?
**A**: Your data is permanently lost. There is no recovery mechanism.

### Q: How do I back up my network?
**A**: Download the `.enc.json` file and store copies in multiple secure locations (encrypted USB drive, password manager, etc.).

### Q: Can I change my password?
**A**: Not currently. You'd need to create a new file with a new password and manually recreate your network.

### Q: Is this more secure than LastPass/1Password?
**A**: Similar security model (client-side encryption), but those are battle-tested by millions of users. This is newer but uses the same proven cryptographic standards.

### Q: What if there's a bug in the encryption code?
**A**: The actual encryption is done by Web Crypto API (built into your browser, audited by security experts). Our code just calls it correctly.

---

## 📞 Reporting Security Issues

If you discover a security vulnerability, please:

1. **DO NOT** open a public GitHub issue
2. Email security details privately (if developer provides contact)
3. Allow reasonable time for a fix before public disclosure
4. Provide detailed reproduction steps

---

## 📝 License & Liability

This software is provided "as is" without warranty. Use at your own risk.

**You are responsible for**:
- Remembering your password
- Backing up your encrypted files
- Securing your computer
- Choosing strong passwords

**We are not liable for**:
- Lost passwords
- Lost data
- Unauthorized access due to weak passwords
- Malware on your computer

---

## ✅ Final Verdict

**Is this secure enough for sensitive data?**

**YES**, if:
- ✅ You use a strong, unique password
- ✅ You keep backups of your files
- ✅ Your computer is secure (no malware)
- ✅ You understand the limitations

**NO**, if:
- ❌ You use weak/reused passwords
- ❌ Your computer is compromised with malware
- ❌ You need password recovery options
- ❌ You require compliance certifications (HIPAA, SOC 2, etc.)

---

**Bottom Line**: This application provides the same level of encryption as leading password managers and encrypted note apps. Your data is as secure as the password you choose and the device you use.

**Stay safe!** 🔒
