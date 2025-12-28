# Vehiclee-PaperAdsSaaS: Technical Architecture & Design

**Author:** Kashif Shoukat 
**Date:** December 2025  
**Project:** Vehiclee - Paper Ads SaaS Platform  
**Phase:** Pilot MVP (Weeks 1-4)

---

## Executive Summary

Vehiclee-PaperAdsSaaS is a **three-sided marketplace and IoT platform** that connects Advertisers (Clients) who fund campaigns, Drivers who carry e-paper advertisements on their vehicles, and Administrators who manage compliance, device fleet operations, billing, and payouts. The platform enables clients to book vehicle-based ad campaigns, drivers to earn passive income, and operators to maintain compliance and scale the network.

This document outlines the technical architecture, database schema, and implementation strategy for the **Pilot MVP**, designed for a two-person development team to deliver a working platform in 4-5 weeks with strict scope cuts and operator-driven workflows.

---

## System Architecture Overview

### Core Principles

The architecture prioritizes **operational simplicity** for the Pilot phase, with clear pathways to automation in Phase 2 and beyond. Key decisions reflect the constraints of a small team and the need for rapid deployment:

1. **Pragmatic Stack:** Node.js (Express) + React 19 + PostgreSQL + tRPC for end-to-end type safety
2. **Manual Workflows:** Admin-driven allocation, payout, and compliance review (automation moves to Phase 2)
3. **Device-First Design:** IoT device stability and offline tolerance are critical to platform reliability
4. **Ledger-Based Billing:** Wallet and spend tracking in the database; Stripe integration for top-ups only

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Vehiclee-PaperAdsSaaS Platform              │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Client     │         │    Driver    │         │    Admin     │
│  (Web App)   │         │ (Mobile App) │         │  (Web App)   │
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │                        │                        │
       └────────────────────────┼────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   tRPC API Gateway    │
                    │  (Express + tRPC)     │
                    └───────────┬───────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
   ┌────▼─────┐          ┌─────▼──────┐         ┌──────▼────┐
   │ PostgreSQL│          │   Redis    │         │ S3 Storage│
   │ Database  │          │   Queue    │         │ (Creatives)
   └──────────┘          └────────────┘         └───────────┘
        │                       │
        └───────────────────────┼───────────────────────┐
                                │                       │
                    ┌───────────▼───────────┐   ┌──────▼────┐
                    │  Device Agent         │   │ Stripe API│
                    │  (Content Pull, OTA)  │   │ (Payments)│
                    └───────────────────────┘   └───────────┘
```

### Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Backend Runtime** | Node.js 22 + Express 4 | Fast development, JavaScript ecosystem, proven at scale |
| **API Framework** | tRPC 11 | End-to-end type safety, automatic client generation, minimal boilerplate |
| **Frontend** | React 19 + Tailwind CSS 4 | Modern, responsive, component-driven development |
| **Database** | PostgreSQL | Relational integrity for ledger, compliance, device state |
| **Job Queue** | Redis + BullMQ | Async tasks (OTA, notifications, batch payouts) |
| **Object Storage** | S3-compatible (AWS S3 or Cloudflare R2) | Creatives, invoices, device packages, firmware |
| **Payments** | Stripe | VAT-compliant invoicing for NL/LV, wallet ledger in DB |
| **Maps/Zones** | Mapbox or Google Maps API | Zone visualization, soft enforcement (hard enforcement Phase 2+) |
| **Authentication** | Manus OAuth | Built-in user management, role-based access control |
| **Observability** | Sentry + basic metrics | Error tracking, performance monitoring |

---

## Database Schema (Pilot MVP)

### Core Entities

The schema is designed for **ledger-based billing**, **compliance auditing**, and **device fleet management**. All timestamps are stored as UTC Unix milliseconds.

#### 1. Users & Roles

```sql
-- Core user table (extended from template)
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(64) UNIQUE NOT NULL,
  email VARCHAR(320),
  name TEXT,
  role ENUM('user', 'admin', 'client', 'driver') DEFAULT 'user',
  companyName VARCHAR(255),
  companyVatId VARCHAR(32),
  companyCountry ENUM('NL', 'LV', 'OTHER'),
  kycStatus ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP,
  UNIQUE KEY (openId)
);

-- Client (Advertiser) Profile
CREATE TABLE clientProfiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL UNIQUE,
  companyName VARCHAR(255) NOT NULL,
  companyVatId VARCHAR(32),
  companyCountry ENUM('NL', 'LV', 'OTHER') NOT NULL,
  contactPerson VARCHAR(255),
  walletBalance BIGINT DEFAULT 0, -- in cents
  totalSpent BIGINT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Driver Profile
CREATE TABLE driverProfiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL UNIQUE,
  licenseNumber VARCHAR(32),
  licenseExpiry DATE,
  documentStatus ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  documentReviewedAt TIMESTAMP,
  documentReviewedBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (documentReviewedBy) REFERENCES users(id)
);
```

#### 2. Vehicles & Devices

```sql
-- Vehicle Registration
CREATE TABLE vehicles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  driverId INT NOT NULL,
  licensePlate VARCHAR(32) NOT NULL UNIQUE,
  make VARCHAR(64),
  model VARCHAR(64),
  year INT,
  color VARCHAR(32),
  approvalStatus ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approvedAt TIMESTAMP,
  approvedBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (driverId) REFERENCES driverProfiles(id) ON DELETE CASCADE,
  FOREIGN KEY (approvedBy) REFERENCES users(id)
);

-- E-Paper Device
CREATE TABLE devices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vehicleId INT NOT NULL UNIQUE,
  deviceId VARCHAR(64) UNIQUE NOT NULL, -- Hardware serial or UUID
  deviceSecret VARCHAR(255) NOT NULL, -- For authentication
  model VARCHAR(64), -- e.g., "Waveshare 7.5-inch"
  resolution VARCHAR(32), -- e.g., "800x480"
  colorMode VARCHAR(32), -- e.g., "bw", "7color"
  status ENUM('provisioning', 'active', 'offline', 'error') DEFAULT 'provisioning',
  lastHeartbeat TIMESTAMP,
  lastContentHash VARCHAR(64),
  currentImageUrl TEXT,
  firmwareVersion VARCHAR(32),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE,
  INDEX (status, lastHeartbeat)
);

-- Device Telemetry (for monitoring)
CREATE TABLE deviceTelemetry (
  id INT PRIMARY KEY AUTO_INCREMENT,
  deviceId INT NOT NULL,
  heartbeatAt TIMESTAMP,
  contentHash VARCHAR(64),
  uptime INT, -- seconds
  batteryLevel INT, -- percentage
  signalStrength INT, -- RSSI
  errorCode VARCHAR(32),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (deviceId) REFERENCES devices(id) ON DELETE CASCADE,
  INDEX (deviceId, heartbeatAt)
);
```

#### 3. Campaigns & Bookings

```sql
-- Zones (predefined or soft)
CREATE TABLE zones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  city VARCHAR(64) NOT NULL,
  zoneName VARCHAR(128),
  polygonGeoJson JSON, -- GeoJSON polygon (Phase 2+)
  priceModifier DECIMAL(3, 2) DEFAULT 1.0, -- 0.8 = 20% discount
  exclusivityFlag BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY (city, zoneName)
);

-- Campaign
CREATE TABLE campaigns (
  id INT PRIMARY KEY AUTO_INCREMENT,
  clientId INT NOT NULL,
  campaignName VARCHAR(255) NOT NULL,
  description TEXT,
  city VARCHAR(64) NOT NULL,
  zoneId INT,
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  numberOfCars INT NOT NULL,
  dailyBudget BIGINT NOT NULL, -- in cents
  totalBudget BIGINT NOT NULL, -- in cents
  status ENUM('draft', 'awaiting_creative', 'awaiting_approval', 'approved', 'active', 'completed', 'cancelled') DEFAULT 'draft',
  complianceApprovedAt TIMESTAMP,
  complianceApprovedBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clientId) REFERENCES clientProfiles(id) ON DELETE CASCADE,
  FOREIGN KEY (zoneId) REFERENCES zones(id),
  FOREIGN KEY (complianceApprovedBy) REFERENCES users(id),
  INDEX (status, startDate)
);

-- Creative (Ad Content)
CREATE TABLE creatives (
  id INT PRIMARY KEY AUTO_INCREMENT,
  campaignId INT NOT NULL,
  assetUrl TEXT NOT NULL, -- S3 URL
  assetKey VARCHAR(255) NOT NULL, -- S3 key for retrieval
  creativeType ENUM('template', 'custom', 'ai_generated') DEFAULT 'template',
  templateId VARCHAR(64),
  approvalStatus ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  clientApprovedAt TIMESTAMP,
  complianceApprovedAt TIMESTAMP,
  complianceApprovedBy INT,
  rejectionReason TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (campaignId) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (complianceApprovedBy) REFERENCES users(id)
);

-- Campaign Allocation (Manual in Pilot)
CREATE TABLE campaignAllocations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  campaignId INT NOT NULL,
  deviceId INT NOT NULL,
  allocationStartDate DATE NOT NULL,
  allocationEndDate DATE NOT NULL,
  status ENUM('scheduled', 'active', 'completed', 'cancelled') DEFAULT 'scheduled',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (campaignId) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (deviceId) REFERENCES devices(id) ON DELETE CASCADE,
  UNIQUE KEY (deviceId, allocationStartDate, allocationEndDate),
  INDEX (campaignId, status)
);
```

#### 4. Billing & Wallet

```sql
-- Wallet Ledger (immutable transaction log)
CREATE TABLE walletLedger (
  id INT PRIMARY KEY AUTO_INCREMENT,
  clientId INT NOT NULL,
  transactionType ENUM('topup', 'spend', 'refund', 'adjustment') NOT NULL,
  amount BIGINT NOT NULL, -- in cents (positive for credit, negative for debit)
  balanceBefore BIGINT NOT NULL,
  balanceAfter BIGINT NOT NULL,
  reference VARCHAR(255), -- Campaign ID, invoice ID, etc.
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clientId) REFERENCES clientProfiles(id) ON DELETE CASCADE,
  INDEX (clientId, createdAt)
);

-- Invoice (VAT-compliant)
CREATE TABLE invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  clientId INT NOT NULL,
  invoiceNumber VARCHAR(32) UNIQUE NOT NULL, -- NL/LV format
  campaignId INT,
  invoiceDate DATE NOT NULL,
  dueDate DATE NOT NULL,
  subtotal BIGINT NOT NULL, -- in cents
  vatAmount BIGINT NOT NULL,
  total BIGINT NOT NULL,
  vatRate DECIMAL(5, 2) NOT NULL, -- e.g., 21.00 for NL
  status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
  pdfUrl TEXT, -- S3 URL
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clientId) REFERENCES clientProfiles(id) ON DELETE CASCADE,
  FOREIGN KEY (campaignId) REFERENCES campaigns(id),
  INDEX (status, dueDate)
);

-- Payout (Driver earnings)
CREATE TABLE payouts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  driverId INT NOT NULL,
  campaignAllocationId INT NOT NULL,
  earningAmount BIGINT NOT NULL, -- in cents
  formula VARCHAR(255), -- "active_days + uptime"
  activeDays INT,
  averageUptime DECIMAL(5, 2), -- percentage
  status ENUM('pending', 'approved', 'paid', 'disputed') DEFAULT 'pending',
  paidAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (driverId) REFERENCES driverProfiles(id) ON DELETE CASCADE,
  FOREIGN KEY (campaignAllocationId) REFERENCES campaignAllocations(id) ON DELETE CASCADE,
  INDEX (status, createdAt)
);
```

#### 5. Compliance & Support

```sql
-- Compliance Queue
CREATE TABLE complianceQueue (
  id INT PRIMARY KEY AUTO_INCREMENT,
  entityType ENUM('creative', 'campaign', 'driver') NOT NULL,
  entityId INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'escalated') DEFAULT 'pending',
  reviewedBy INT,
  reviewedAt TIMESTAMP,
  rejectionReason TEXT,
  restrictedCategories JSON, -- ["weapons", "adult", ...]
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (reviewedBy) REFERENCES users(id),
  INDEX (status, createdAt)
);

-- Support Tickets
CREATE TABLE supportTickets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  ticketType ENUM('driver_issue', 'campaign_issue', 'payment_issue', 'device_issue', 'other') NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  assignedTo INT,
  resolution TEXT,
  resolvedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assignedTo) REFERENCES users(id),
  INDEX (status, priority, createdAt)
);

-- Audit Log
CREATE TABLE auditLog (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT,
  action VARCHAR(255) NOT NULL, -- "campaign_approved", "driver_rejected", etc.
  entityType VARCHAR(64),
  entityId INT,
  changes JSON, -- Before/after values
  reason TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  INDEX (entityType, entityId, createdAt)
);
```

### Schema Design Rationale

**Ledger-Based Billing:** The `walletLedger` table maintains an immutable transaction log, ensuring financial auditability and preventing double-spending. Each transaction records the balance before and after, enabling reconciliation.

**Compliance Auditing:** The `complianceQueue` and `auditLog` tables create a complete audit trail for regulatory compliance, with timestamps and reviewer attribution for every approval/rejection.

**Device State Management:** The `deviceTelemetry` table captures heartbeat history, enabling monitoring of device health, uptime calculations, and anomaly detection for fraud prevention.

**Soft Zone Enforcement:** In the Pilot, zones are stored but not strictly enforced; devices are allocated manually. Phase 2 introduces geofencing and automated allocation rules.

---

## API Design (tRPC Procedures)

### Authentication & Authorization

All procedures use Manus OAuth for identity verification. Role-based access control (RBAC) gates operations:

```typescript
// Procedure types
publicProcedure        // No authentication required
protectedProcedure     // Authenticated user required
clientProcedure        // Authenticated + role === 'client'
driverProcedure        // Authenticated + role === 'driver'
adminProcedure         // Authenticated + role === 'admin'
```

### Core Procedure Groups

#### Client Procedures

| Procedure | Input | Output | Notes |
|-----------|-------|--------|-------|
| `client.walletTopup` | `{ amount: number }` | `{ transactionId, newBalance }` | Initiates Stripe payment |
| `client.createCampaign` | Campaign details | `{ campaignId }` | Creates draft campaign |
| `client.uploadAsset` | File + metadata | `{ assetUrl, assetKey }` | Uploads to S3 |
| `client.submitCreative` | `{ campaignId, assetKey }` | `{ creativeId }` | Submits for approval |
| `client.approveCampaign` | `{ campaignId }` | `{ success }` | Client approves creative |
| `client.getCampaigns` | Filters | `{ campaigns[] }` | Lists user's campaigns |
| `client.getCampaignDetail` | `{ campaignId }` | Campaign object | Full campaign state |
| `client.getInvoices` | Filters | `{ invoices[] }` | Lists VAT invoices |
| `client.downloadInvoicePdf` | `{ invoiceId }` | PDF URL | S3 presigned URL |

#### Driver Procedures

| Procedure | Input | Output | Notes |
|-----------|-------|--------|-------|
| `driver.uploadDocuments` | Files + metadata | `{ documentId }` | License, insurance, etc. |
| `driver.registerVehicle` | Vehicle details | `{ vehicleId }` | Creates vehicle record |
| `driver.scheduleInstallation` | `{ vehicleId, preferredDate }` | `{ appointmentId }` | Requests installation slot |
| `driver.getDeviceStatus` | `{ deviceId }` | Device state | Current campaign, uptime, etc. |
| `driver.getEarnings` | Filters | `{ payouts[] }` | Historical and pending payouts |
| `driver.createTicket` | Ticket details | `{ ticketId }` | Support request |
| `driver.getTickets` | Filters | `{ tickets[] }` | User's support tickets |

#### Admin Procedures

| Procedure | Input | Output | Notes |
|-----------|-------|--------|-------|
| `admin.approveDriver` | `{ driverId, approved }` | `{ success }` | KYC approval |
| `admin.approveVehicle` | `{ vehicleId, approved }` | `{ success }` | Vehicle registration |
| `admin.reviewCompliance` | `{ entityId, approved, reason }` | `{ success }` | Compliance queue |
| `admin.allocateCampaign` | `{ campaignId, deviceIds[] }` | `{ allocations[] }` | Manual allocation |
| `admin.getDeviceFleet` | Filters | `{ devices[] }` | Fleet dashboard |
| `admin.getComplianceQueue` | Filters | `{ queue[] }` | Pending reviews |
| `admin.getTickets` | Filters | `{ tickets[] }` | Support inbox |
| `admin.exportPayouts` | `{ month, year }` | CSV data | Manual payout export |
| `admin.manageZones` | Zone operations | `{ zones[] }` | CRUD zones |

---

## Device Communication Protocol

### Device Agent Architecture

The device runs a lightweight agent (Python or C) that:

1. **Authenticates** using device credentials (deviceId + deviceSecret)
2. **Pulls content** once daily or on-demand
3. **Caches** the last known good image
4. **Sends heartbeats** every 15-60 minutes
5. **Reports telemetry** (uptime, battery, signal strength)

### Content Pull Flow

```
Device (Daily or On-Demand)
  ↓
GET /api/device/{deviceId}/content
  ├─ Auth: deviceSecret
  ├─ Response: { imageUrl, contentHash, expiresAt }
  └─ Device caches image locally
  
If pull fails:
  → Device displays last cached image
  → Retries on next heartbeat
```

### Heartbeat Protocol

```
Device (Every 15-60 minutes)
  ↓
POST /api/device/{deviceId}/heartbeat
  ├─ Auth: deviceSecret
  ├─ Payload: { 
  │   timestamp,
  │   contentHash,
  │   uptime,
  │   battery,
  │   signalStrength,
  │   errorCode (optional)
  │ }
  └─ Response: { ack, nextCheckIn }
```

### OTA (Over-The-Air) Updates - Pilot Phase

In the Pilot, OTA updates are **content/config only**:

```
Admin triggers update
  ↓
POST /api/admin/ota/push
  ├─ Payload: { deviceIds[], imageUrl, config }
  └─ Marks devices for update
  
Device heartbeat
  ├─ Detects pending update
  ├─ Pulls new content
  └─ Confirms receipt
```

Firmware OTA (signed packages, staged rollout, rollback) moves to Phase 2.

---

## Billing & Invoicing (VAT Compliance)

### Wallet Ledger Flow

```
Client Top-Up
  ├─ Stripe payment → webhook
  ├─ Insert walletLedger (topup)
  └─ Update clientProfiles.walletBalance

Campaign Spend
  ├─ Daily job: calculate spend for active campaigns
  ├─ Insert walletLedger (spend)
  └─ Update clientProfiles.walletBalance
  
Campaign Completion
  ├─ Generate invoice
  ├─ Insert invoices table
  └─ Create PDF (S3)
```

### VAT Invoice Generation

Invoices are generated as PDFs with:

- **Invoice number:** Sequential per country (NL-2025-001, LV-2025-001)
- **VAT calculation:** Based on client's company country
- **Line items:** Campaign name, dates, amount, VAT rate
- **Storage:** S3 with presigned URLs for download

### VAT Rates (Pilot)

| Country | Rate | Notes |
|---------|------|-------|
| Netherlands (NL) | 21% | Standard rate |
| Latvia (LV) | 21% | Standard rate |
| Other | 0% | Reverse charge or exemption (Phase 2) |

---

## Payout Formula (Pilot MVP)

The Pilot uses a **simple, measurable formula** that can be calculated from available telemetry:

```
Payout = (Active Days × Daily Rate) × (Average Uptime % / 100)

Example:
  Active Days: 20 days
  Daily Rate: €2.00
  Average Uptime: 95%
  
  Payout = (20 × €2.00) × (95 / 100) = €38.00
```

**Rationale:**
- **Active Days:** Counted from campaign allocation records
- **Daily Rate:** Set by admin per zone/campaign
- **Uptime %:** Calculated from heartbeat telemetry (days with ≥1 heartbeat / total days)

This formula avoids GPS/location-based payouts (Phase 3), which require additional infrastructure.

---

## Security & Compliance

### Authentication & Authorization

- **Manus OAuth:** All users authenticate via Manus OAuth
- **Session Management:** JWT-based sessions with secure cookies
- **RBAC:** Role-based access control enforced at procedure level
- **Device Auth:** Device credentials (deviceId + deviceSecret) for IoT communication

### Data Protection

- **GDPR Compliance:** Driver PII minimization, consent tracking, right-to-delete process
- **Encryption:** TLS 1.3 for all API traffic, encrypted database connections
- **Secrets Management:** Environment variables for API keys, database credentials, device secrets
- **Audit Logging:** All compliance decisions, approvals, and rejections logged with timestamps and reviewer attribution

### Fraud Prevention (Pilot)

- **Heartbeat Monitoring:** Detect offline devices, anomalous patterns
- **Content Hash Verification:** Ensure device displays correct content
- **Tamper Seals:** Physical seals on devices (operational process)
- **Periodic Photo Proof:** Manual verification by drivers (Phase 2: automated)

---

## Deployment & Operations

### Development Environment

```bash
# Local development
pnpm dev                  # Start dev server (http://localhost:3000)
pnpm db:push             # Apply schema migrations
pnpm test                # Run vitest suite
```

### Production Deployment

- **Frontend:** Vite build → S3 + CloudFront (or Manus hosting)
- **Backend:** Node.js server → Docker container → Kubernetes or managed service
- **Database:** PostgreSQL managed instance (AWS RDS, Azure Database, or Manus managed)
- **Jobs:** Redis queue with BullMQ for async tasks
- **Storage:** S3-compatible (AWS S3, Cloudflare R2, or Manus managed)

### Monitoring & Observability

- **Error Tracking:** Sentry for exception monitoring
- **Metrics:** Basic dashboards for API latency, error rates, device heartbeat health
- **Alerts:** Critical alerts for device fleet degradation, payment failures, compliance queue backlog

---

## Phase Roadmap

### Phase 1: Pilot MVP (Weeks 1-4)
- ✅ Client web app (wallet, campaigns, creative approval)
- ✅ Driver mobile app (registration, device status, earnings)
- ✅ Admin web app (approvals, fleet dashboard, manual allocation)
- ✅ Device provisioning and heartbeat
- ✅ Basic billing and invoicing
- ✅ Support ticketing

### Phase 2: Full MVP (Weeks 5-10)
- Client mobile app
- Firmware OTA with staged rollout
- Automated allocation rules engine
- Payout engine v1 (measurable formula)
- Reporting v1 (uptime, delivery %)
- Dispute workflow

### Phase 3: EU Scaling (Weeks 11-20)
- KYC provider integration
- Advanced compliance policy engine
- GPS-based location truth source
- Fleet owner role
- Accounting integrations
- Advanced analytics

---

## Conclusion

This architecture provides a **pragmatic foundation** for the Vehiclee-PaperAdsSaaS Pilot MVP, balancing rapid development with operational stability. The schema supports future automation, compliance auditing, and scaling to multiple cities and regions. By keeping manual workflows in the Pilot and automating incrementally in Phase 2+, the team can deliver a working platform quickly while maintaining code quality and auditability.

---

## References

1. [Vehiclee-PaperAdsSaaS Scope & Delivery Plan](file:///home/ubuntu/upload/Vehiclee‑PaperAdsSaaS—Scope,PhasedDeliveryPlan,Timeline&RiskRegister(Riga+AmsterdamPilot).docx)
2. [tRPC Documentation](https://trpc.io)
3. [PostgreSQL Documentation](https://www.postgresql.org/docs/)
4. [Express.js Guide](https://expressjs.com/)
5. [React 19 Documentation](https://react.dev)
