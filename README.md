# ChainShield
### Blockchain-Based Security Audit System

ChainShield is a security audit platform that combines automated security testing, tamper-evident audit logging, and blockchain technology to improve the integrity, traceability, and accountability of system activities.

The platform is designed to detect potential security vulnerabilities, record important system activities, and preserve audit evidence through cryptographic hashing and blockchain anchoring.

---

## Key Features

### 1. Authentication & Access Control
- API authentication using Laravel Sanctum.
- Role-Based Access Control (RBAC).
- Role-based permissions for administrators, security analysts, penetration testers, auditors, and users.
- Protected API endpoints.

### 2. Audit Logging
- Records important system activities, including authentication and administrative operations.
- SHA-256 hash-chain mechanism for tamper detection.
- Audit log batching.
- Merkle Tree implementation for batch integrity verification.
- Audit trail verification.

### 3. Blockchain Integration
- Smart contract-based audit batch registry.
- Blockchain anchoring for audit batch hashes.
- Local blockchain development using Hardhat.
- Sepolia testnet integration.
- On-chain batch verification.
- Blockchain transaction tracking and recovery.

### 4. Automated Security Testing
- Lab target management and authorization workflow.
- Security assessment session management.
- Automated passive security scanners:
  - SQL Injection (SQLi) indicators
  - Cross-Site Scripting (XSS) reflection checks
  - Insecure Direct Object Reference (IDOR) comparison
  - Brute-force protection and rate-limit checks
- Security finding storage and evidence tracking.
- CVSS-based severity assessment.

### 5. Automated Operations
- Scheduled audit batch creation.
- Scheduled blockchain transaction recovery.
- Automated security testing through Artisan commands.
- Laravel-to-Python runner integration.
- HMAC-based request authentication between Laravel and the Python security runner.

---

## System Architecture

```text
                    CHAINSHIELD
                         |
          +--------------+--------------+
          |                             |
     Laravel Backend              Blockchain Layer
          |                             |
     REST API                    Hardhat / Ethereum
          |                             |
   +------+------+               Smart Contract
   |      |      |                     |
 Auth  Audit   Security                 |
   |   Logging  Testing                 |
   |      |      |                     |
   |   SHA-256   Python Runner           |
   |   Hash      |                     |
   |   Chain     |                     |
   |      |      |                     |
   +------+------|                     |
          |      |                     |
      Audit Batch Hash                  |
          |                             |
      Merkle Tree                       |
          |                             |
      Blockchain Anchoring -------------+
          |
      Integrity Verification
```

---

## Technology Stack

| Component | Technology |
|---|---|
| Backend Framework | Laravel |
| Programming Language | PHP |
| Authentication | Laravel Sanctum |
| Database | MariaDB |
| Security Runner | Python |
| Blockchain Framework | Hardhat |
| Smart Contract | Solidity |
| Blockchain Library | ethers.js |
| Cryptographic Hashing | SHA-256 |
| API Architecture | REST API |

---

## Project Structure

```text
chainshield/
├── backend/
│   ├── app/
│   │   ├── Console/
│   │   ├── Http/
│   │   ├── Models/
│   │   └── Services/
│   ├── database/
│   ├── routes/
│   ├── tests/
│   └── ...
│
├── blockchain/
│   ├── contracts/
│   ├── scripts/
│   ├── test/
│   └── ...
│
├── security-runner/
│   └── ...
│
├── documentation/
├── frontend/
└── README.md
```

---

## Getting Started

### Prerequisites

Install the following tools:

- PHP 8.2 or later
- Composer
- Node.js and npm
- Python 3.11 or later
- MariaDB or MySQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/alifhmiysf/chainshield.git

cd chainshield
```

### 2. Setup Laravel Backend

```bash
cd backend

composer install

Copy-Item .env.example .env

php artisan key:generate
```

Configure the database connection and other required environment variables in `.env`.

Run database migrations:

```bash
php artisan migrate
```

Start the Laravel development server:

```bash
php artisan serve
```

Backend URL:

```text
http://127.0.0.1:8000
```

### 3. Setup Blockchain

```bash
cd ../blockchain

npm install
```

Configure the blockchain network and required environment variables according to the blockchain configuration.

Compile the smart contracts:

```bash
npx hardhat compile
```

Run the local blockchain and deployment scripts according to the project's Hardhat configuration.

### 4. Setup Python Security Runner

```bash
cd ../security-runner

python -m venv .venv
```

Activate the virtual environment on Windows:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

Configure the shared runner secret for HMAC authentication in the Laravel and Python environments.

---

## Available Artisan Commands

Run the commands from the `backend` directory.

| Command | Description |
|---|---|
| `php artisan chainshield:batch-audits` | Create an audit batch from unbatched logs |
| `php artisan chainshield:recover-transactions` | Recover pending blockchain transactions |
| `php artisan chainshield:run-security-tests {session_id}` | Run automated security tests for a lab session |

Audit batching and blockchain recovery are also configured for scheduled execution.

---

## Running Tests

Run the Laravel automated test suite:

```bash
php artisan test
```

The latest recorded test result:

- **26 tests passed**
- **88 assertions**
- No failing tests

The test suite covers audit batching, blockchain transaction recovery, lab security execution, and automated security testing.

---

## API Overview

The API uses the `/api/v1` prefix.

Authentication endpoints include:

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register a user |
| POST | `/api/v1/auth/login` | Authenticate a user |
| GET | `/api/v1/auth/me` | Retrieve authenticated user |
| POST | `/api/v1/auth/logout` | Logout |

Additional API modules include audit logs, audit batches, blockchain verification, lab targets, lab sessions, and security findings.

---

## Security Considerations

- Passwords and authentication credentials must be securely managed.
- Protected operations use permission checks.
- Audit records are linked using cryptographic hashes.
- Blockchain transactions are tracked and recoverable.
- Python runner requests use HMAC authentication.
- Security testing is designed around authorized lab targets.
- IDOR comparison tokens are excluded from audit log payloads.

**Important:** Security scanner results are assessment evidence, not a guarantee that a target is free from vulnerabilities. Only test systems for which proper authorization has been obtained.

---

## Development Status

| Module | Status |
|---|---|
| Authentication & RBAC | Implemented |
| Audit Logging | Implemented |
| Hash Chain & Merkle Tree | Implemented |
| Blockchain Anchoring | Implemented |
| Blockchain Verification | Tested |
| Transaction Recovery | Tested |
| Lab Target & Session Management | Implemented |
| Automated Security Testing | Tested |
| Frontend | In Development |
| Production Readiness Review | Pending |

---

## Project Goals

ChainShield aims to provide:

1. A verifiable audit trail for important system activities.
2. Improved integrity and accountability through blockchain anchoring.
3. Automated security assessment capabilities.
4. Centralized security findings and audit evidence.
5. A foundation for more transparent and reliable security auditing.

---

## Author

**Ali Fahmi Yusuf**  
Backend Engineer

GitHub: [@alifhmiysf](https://github.com/alifhmiysf)

---

## License

This project is currently under development. Licensing and distribution terms will be specified separately.
