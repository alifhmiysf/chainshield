# ChainShield
### Blockchain-Based Security Audit System

ChainShield is a blockchain-based security audit platform that combines automated security testing, tamper-evident audit logging, and blockchain technology to improve the integrity, traceability, and accountability of system activities.

The platform is designed to monitor important system activities, detect potential security vulnerabilities, preserve audit evidence through cryptographic hashing, and anchor audit batch fingerprints to a blockchain network.

ChainShield integrates a Laravel REST API, React frontend, Python-based security runner, and Ethereum-compatible smart contracts.

---

## Table of Contents

- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Installation](#installation)
- [Running ChainShield Locally](#running-chainshield-locally)
- [Terminal Overview](#terminal-overview)
- [Audit Batch Workflow](#audit-batch-workflow)
- [Available Artisan Commands](#available-artisan-commands)
- [API Overview](#api-overview)
- [Testing](#testing)
- [Security and Privacy](#security-and-privacy)
- [Development Status](#development-status)
- [Limitations](#limitations)
- [Author](#author)
- [License](#license)

---

## Key Features

### 1. Authentication & Access Control

- API authentication using Laravel Sanctum.
- Role-Based Access Control (RBAC).
- Role-based permissions for administrators, security analysts, penetration testers, auditors, and users.
- Protected API endpoints.
- Authenticated user profile and permission management.

### 2. Audit Logging

- Records important system activities, including authentication, administrative operations, and security-related activities.
- SHA-256 hash-chain mechanism for tamper detection.
- Sequential audit log records.
- Audit batch creation.
- Merkle Tree implementation for batch integrity verification.
- Audit trail integrity verification.

### 3. Blockchain Integration

- Smart contract-based audit batch registry.
- Blockchain anchoring for audit batch Merkle roots.
- Local blockchain development using Hardhat.
- Ethereum Sepolia testnet configuration.
- On-chain batch verification.
- Blockchain transaction tracking and recovery.
- Blockchain transaction and deployment records.

### 4. Automated Security Testing

- Lab target management.
- Target authorization and approval workflow.
- Security assessment session management.
- Automated passive security scanners:
  - SQL Injection (SQLi) indicators.
  - Cross-Site Scripting (XSS) reflection checks.
  - Insecure Direct Object Reference (IDOR) comparison.
  - Brute-force protection and rate-limit checks.
- Security finding storage and evidence tracking.
- CVSS-based severity assessment.
- Scanner execution through a Python security runner.

### 5. Security Runner Integration

- Laravel-to-Python process integration.
- Python virtual environment support.
- HMAC-based request authentication.
- Request timestamp validation.
- Configurable execution timeout.
- Scanner result validation.
- Controlled security testing against authorized targets.

### 6. Frontend Dashboard

- Authentication interface.
- Role-based navigation and access control.
- Security dashboard.
- Audit log monitoring.
- Audit batch management.
- Blockchain monitoring.
- Batch detail inspection.
- Blockchain anchoring and verification interface.
- Lab target and session management.
- Security findings visualization.

### 7. Automated Operations

- Scheduled audit batch creation.
- Scheduled blockchain transaction recovery.
- Automated security testing through Artisan commands.
- Laravel task scheduling.
- Configurable blockchain network settings.

---

## System Architecture

```text
                         CHAINSHIELD
                              |
                    +---------+---------+
                    |                   |
                Frontend           Backend API
                React/Vite         Laravel
                    |                   |
                    |             REST API / Sanctum
                    |                   |
                    |       +-----------+-----------+
                    |       |           |           |
                    |      Auth       Audit      Security
                    |      RBAC       Logging     Testing
                    |                   |           |
                    |               SHA-256    Python Runner
                    |               Hash Chain      |
                    |                   |           |
                    |               Audit Batch     |
                    |                   |           |
                    |               Merkle Tree     |
                    |                   |           |
                    +-------------------+-----------+
                                        |
                               Blockchain Service
                                        |
                                Hardhat / Ethereum
                                        |
                                Smart Contract
                                        |
                                Batch Anchoring
                                        |
                              Integrity Verification
```

### Audit Integrity Architecture

ChainShield uses multiple integrity mechanisms:

1. **SHA-256 Hash Chain**  
   Links audit records using cryptographic hashes to help detect modifications.

2. **Merkle Tree**  
   Combines audit record hashes into a Merkle root representing a batch.

3. **Blockchain Anchoring**  
   Stores the batch fingerprint on the blockchain.

4. **Integrity Verification**  
   Compares the stored audit evidence with the generated batch fingerprint and on-chain record.

The blockchain stores the batch fingerprint, not the complete audit log contents.

---

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React |
| Frontend Build Tool | Vite |
| Styling | Tailwind CSS |
| Backend Framework | Laravel |
| Programming Language | PHP |
| Authentication | Laravel Sanctum |
| Authorization | Role-Based Access Control |
| Database | MariaDB |
| Security Runner | Python |
| Blockchain Framework | Hardhat |
| Smart Contract | Solidity |
| Blockchain Library | ethers.js |
| Cryptographic Hashing | SHA-256 |
| API Architecture | REST API |
| Request Authentication | HMAC |

---

## Project Structure

```text
chainshield/
│
├── backend/
│   ├── app/
│   │   ├── Console/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   └── Middleware/
│   │   ├── Models/
│   │   └── Services/
│   │
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── routes/
│   ├── tests/
│   ├── .env.example
│   └── ...
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── layouts/
│   │   ├── pages/
│   │   └── services/
│   │
│   ├── package.json
│   └── ...
│
├── blockchain/
│   ├── contracts/
│   ├── scripts/
│   ├── test/
│   ├── hardhat.config.js
│   └── package.json
│
├── security-runner/
│   ├── app/
│   │   └── scanners/
│   ├── tests/
│   ├── requirements.txt
│   └── ...
│
├── documentation/
├── scripts/
└── README.md
```

---

## Requirements

Install the following tools before setting up the project:

| Software | Minimum / Recommended |
|---|---|
| PHP | 8.2 or later |
| Composer | 2.x |
| Node.js | 20 or later |
| npm | Compatible with Node.js |
| Python | 3.11 or later |
| MariaDB | 10.x or compatible MySQL |
| Git | Latest stable version |

Additional PHP requirements depend on the Laravel dependencies and enabled PHP extensions.

---

## Installation

### 1. Clone the Repository

```powershell
git clone https://github.com/alifhmiysf/chainshield.git

cd chainshield
```

### 2. Setup Laravel Backend

Navigate to the backend directory:

```powershell
cd backend
```

Install PHP dependencies:

```powershell
composer install
```

Create the environment file:

```powershell
Copy-Item .env.example .env
```

Generate the Laravel application key:

```powershell
php artisan key:generate
```

Configure the database and application environment in `.env`.

Example local database configuration:

```env
APP_ENV=local
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=chainshield_db
DB_USERNAME=root
DB_PASSWORD=
```

Configure the other required environment variables according to the project's configuration, including blockchain and Python runner settings.

Run migrations:

```powershell
php artisan migrate --seed
```

If the database has already been initialized, do not run destructive database commands such as `migrate:fresh` unless you intentionally want to erase its data.

Clear Laravel cached configuration:

```powershell
php artisan optimize:clear
```

### 3. Setup Frontend

Open another terminal and navigate to the frontend directory:

```powershell
cd D:\Coding\Exercise\chainshield\frontend
```

Install dependencies:

```powershell
npm install
```

Configure the frontend environment if required by the API service.

Build the production frontend:

```powershell
npm run build
```

### 4. Setup Blockchain

Navigate to the blockchain directory:

```powershell
cd D:\Coding\Exercise\chainshield\blockchain
```

Install dependencies:

```powershell
npm install
```

Compile the smart contracts:

```powershell
npx hardhat compile
```

Configure the desired blockchain network and deployment environment.

### 5. Setup Python Security Runner

Navigate to the runner directory:

```powershell
cd D:\Coding\Exercise\chainshield\security-runner
```

Create a virtual environment:

```powershell
python -m venv .venv
```

Activate it on Windows:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
python -m pip install --upgrade pip

pip install -r requirements.txt
```

Configure the shared HMAC secret in the Laravel and Python environments.

The secret must be identical on both sides.

Check available scanners:

```powershell
python -m app --list-scanners
```

Use the runner's actual entry point and options as defined by the installed project version.

---

## Running ChainShield Locally

ChainShield consists of several independent components. For local development, run them in separate PowerShell terminals.

### Recommended Startup Order

1. Start MariaDB.
2. Start the Hardhat local blockchain.
3. Deploy the smart contract if it has not already been deployed to the current local chain.
4. Start the Laravel backend.
5. Start the React frontend.
6. Optionally start a local HTTP server for authorized scanner testing.
7. Start Laravel's scheduler if scheduled jobs need to run during development.

### Terminal 1 — MariaDB

Start the MariaDB service using XAMPP or your installed database manager.

Make sure the database is available at:

```text
127.0.0.1:3306
```

The database name used by this setup is:

```text
chainshield_db
```

### Terminal 2 — Hardhat Local Blockchain

Navigate to the blockchain directory:

```powershell
cd D:\Coding\Exercise\chainshield\blockchain
```

Start the local blockchain:

```powershell
npx hardhat node
```

Expected local RPC endpoint:

```text
http://127.0.0.1:8545
```

Expected local chain ID:

```text
31337
```

Keep this terminal running.

**Important:** Do not start another Hardhat node if one is already running on port `8545`. Restarting the node creates a new local blockchain state and may invalidate the previous deployment and local transaction history.

### Terminal 3 — Smart Contract Deployment

Only needed when deploying or redeploying the smart contract.

Open another PowerShell terminal:

```powershell
cd D:\Coding\Exercise\chainshield\blockchain
```

Inspect the deployment scripts:

```powershell
Get-ChildItem .\scripts
```

Run the deployment script using the actual filename in the repository. For example, if the deployment file is `scripts/deploy.js`:

```powershell
npx hardhat run .\scripts\deploy.js --network localhost
```

After deployment, configure the resulting contract address in the Laravel blockchain configuration.

Make sure the following values match the running Hardhat node and deployed contract:

- Blockchain network: `localhost`
- Chain ID: `31337`
- RPC URL: `http://127.0.0.1:8545`
- Smart contract address: the address returned by deployment

Do not use a contract address from an old Hardhat session after restarting the local node unless the contract has been redeployed at that address.

### Terminal 4 — Laravel Backend

Navigate to the backend directory:

```powershell
cd D:\Coding\Exercise\chainshield\backend
```

Clear cached configuration:

```powershell
php artisan optimize:clear
```

Start the Laravel development server:

```powershell
php artisan serve --host=127.0.0.1 --port=8000
```

Backend URL:

```text
http://127.0.0.1:8000
```

API base URL:

```text
http://127.0.0.1:8000/api/v1
```

Health endpoint:

```text
http://127.0.0.1:8000/api/health
```

Keep this terminal running.

### Terminal 5 — React Frontend

Open another PowerShell terminal:

```powershell
cd D:\Coding\Exercise\chainshield\frontend
```

Start Vite:

```powershell
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

Open the URL shown in the terminal.

Keep this terminal running.

### Terminal 6 — Local HTTP Test Target (Optional)

This terminal is optional. It is useful when you want to serve a local static website as an authorized target for security scanner experiments.

Navigate to a directory containing your test website:

```powershell
cd D:\Coding\Exercise\chainshield\test-target
```

Start the Python HTTP server:

```powershell
python -m http.server 8001 --bind 127.0.0.1
```

The test website will be available at:

```text
http://127.0.0.1:8001
```

**Important distinction:**

- `python -m http.server 8001` serves static files as an HTTP test target.
- It does not start the ChainShield Python Security Runner.
- The Python Security Runner is invoked by the Laravel backend through the configured Python process integration.

The `test-target` directory is optional and should only contain test content you are authorized to assess.

### Terminal 7 — Laravel Scheduler (Optional)

If you want Laravel scheduled tasks to execute during local development, open another terminal:

```powershell
cd D:\Coding\Exercise\chainshield\backend
```

Run:

```powershell
php artisan schedule:work
```

Keep the terminal running while scheduled execution is required.

This allows Laravel to execute tasks registered in its scheduler without requiring a production cron configuration.

---

## Terminal Overview

| Terminal | Command | Purpose |
|---|---|---|
| 1 | Start MariaDB | Database service |
| 2 | `npx hardhat node` | Local blockchain |
| 3 | `npx hardhat run ... --network localhost` | Smart contract deployment, when needed |
| 4 | `php artisan serve --host=127.0.0.1 --port=8000` | Laravel backend |
| 5 | `npm run dev` | React frontend |
| 6 | `python -m http.server 8001 --bind 127.0.0.1` | Optional local test target |
| 7 | `php artisan schedule:work` | Optional task scheduler |

The deployment command is a one-time or occasional operation, not a server that must stay running.

---

## Audit Batch Workflow

ChainShield groups audit logs into batches before anchoring their integrity fingerprints to the blockchain.

The workflow is:

```text
System Activity
      |
      v
Audit Log Creation
      |
      v
SHA-256 Hash Chain
      |
      v
Unbatched Audit Records
      |
      v
Create Audit Batch
      |
      v
Merkle Root Generation
      |
      v
Pending Batch
      |
      v
Blockchain Anchoring
      |
      v
Anchored Batch
      |
      v
Integrity Verification
```

### Batch Immutability

An anchored batch represents a fixed snapshot of audit records.

For example:

| Batch | Sequence Range | Status |
|---|---|---|
| Batch #1 | 1–2 | Pending |
| Batch #2 | 3–3 | Anchored |
| Batch #3 | 4–10 | Anchored |
| Batch #4 | 11–25 | Pending |

New audit records do not automatically become part of an already anchored batch.

They must be included in a new batch.

### Creating a Batch

The backend provides the following command:

```powershell
php artisan chainshield:batch-audits
```

The frontend also provides a batch creation interface for users with the required permission.

### Anchoring a Batch

After a batch has been created, an authorized administrator can submit its Merkle root to the configured blockchain network.

Once confirmed, the transaction information is recorded for later verification.

### Verifying a Batch

Verification checks the integrity of the batch against the stored audit evidence and blockchain record.

An anchored batch cannot be modified by simply adding more audit records.

---

## Available Artisan Commands

Run commands from the `backend` directory.

| Command | Description |
|---|---|
| `php artisan serve` | Start the Laravel development server |
| `php artisan migrate` | Run database migrations |
| `php artisan optimize:clear` | Clear Laravel caches |
| `php artisan route:list` | Display registered routes |
| `php artisan test` | Run automated tests |
| `php artisan chainshield:batch-audits` | Create an audit batch from unbatched logs |
| `php artisan chainshield:recover-transactions` | Recover pending blockchain transactions |
| `php artisan chainshield:run-security-tests {session_id}` | Execute automated security tests for a lab session |
| `php artisan schedule:work` | Run scheduled tasks locally |

Check available project commands using:

```powershell
php artisan list
```

---

## API Overview

The API uses the following prefix:

```text
/api/v1
```

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register a user |
| POST | `/api/v1/auth/login` | Authenticate a user |
| GET | `/api/v1/auth/me` | Retrieve authenticated user |
| POST | `/api/v1/auth/logout` | Logout |

Additional API modules include:

- Audit logs.
- Audit batch creation and inspection.
- Blockchain anchoring.
- Blockchain verification.
- Lab target management.
- Lab session management.
- Security test execution.
- Security findings.

Authenticated endpoints use Laravel Sanctum and permission middleware.

---

## Testing

Run the Laravel automated test suite:

```powershell
cd D:\Coding\Exercise\chainshield\backend

php artisan test
```

### Latest Recorded Test Result

- **26 tests passed**
- **88 assertions**
- No failing tests in the recorded run.

The test suite covers:

- Audit batching.
- Blockchain transaction recovery.
- Lab security execution.
- Automated security testing.

### Frontend Production Build

Run:

```powershell
cd D:\Coding\Exercise\chainshield\frontend

npm run build
```

The production build generates frontend assets inside the `dist` directory.

A large JavaScript chunk warning is a bundle-size optimization notice, not necessarily a build failure.

---

## Security and Privacy

ChainShield is designed for authorized security auditing and local development.

### Credential Protection

Never commit sensitive configuration files or credentials to a public repository.

Do not publish:

- Laravel `.env` files.
- Database passwords.
- Laravel application keys.
- Sanctum access tokens.
- Python runner HMAC secrets.
- Blockchain private keys.
- API credentials.
- Personal or production audit records.

Use `.env.example` to document required configuration variables without including real secrets.

### Local Network Binding

The local development services are configured to use loopback addresses where appropriate:

```text
127.0.0.1
```

This limits access to the local machine for services bound to that address.

Avoid exposing the development database, Hardhat RPC, local test target, or debug-enabled Laravel server to public networks.

### Blockchain Privacy

Only batch fingerprints are anchored on-chain.

Do not place passwords, access tokens, private user information, or complete audit log contents into blockchain transactions.

Blockchain data is generally publicly observable and should be treated as persistent.

### Security Testing Authorization

Security testing must only be performed against systems for which proper authorization has been obtained.

The scanners are designed for controlled assessment and do not guarantee detection of every vulnerability.

### Audit Integrity

Cryptographic hashing and blockchain anchoring provide mechanisms for detecting changes to recorded evidence. They do not automatically guarantee that every event was captured correctly or that the original application was free from compromise.

---

## Development Status

| Module | Status |
|---|---|
| Authentication & RBAC | Implemented |
| Audit Logging | Implemented |
| SHA-256 Hash Chain | Implemented |
| Merkle Tree | Implemented |
| Audit Batch Management | Implemented |
| Blockchain Anchoring | Implemented |
| Blockchain Verification | Tested |
| Transaction Recovery | Tested |
| Lab Target Management | Implemented |
| Lab Session Management | Implemented |
| Automated Security Testing | Tested |
| Python Runner Integration | Implemented |
| React Frontend | Implemented |
| Dashboard & Monitoring | Implemented |
| Production Readiness Review | Pending |

ChainShield's main development modules have been implemented. Production deployment still requires environment-specific configuration, operational hardening, and deployment review.

---

## Limitations

- Security scanners use limited assessment techniques and may produce false positives or false negatives.
- Passive scanning cannot identify every vulnerability.
- Blockchain verification depends on the selected network and the availability of the corresponding RPC endpoint.
- A local Hardhat blockchain is intended for development and testing, not permanent production storage.
- Blockchain transactions may incur gas fees when using public networks.
- Audit integrity depends on correct event capture, key management, database controls, and application security.

---

## Author

**Ali Fahmi Yusuf**  
Backend Engineer

GitHub: [@alifhmiysf](https://github.com/alifhmiysf)

Repository: [ChainShield](https://github.com/alifhmiysf/chainshield)

---

## License

This project is currently under development.

Licensing and distribution terms will be specified separately.