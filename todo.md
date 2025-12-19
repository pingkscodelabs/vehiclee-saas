# Vehiclee-PaperAdsSaaS: Project TODO

**Phase:** Pilot MVP (Weeks 1-4)  
**Team:** 2 developers  
**Last Updated:** December 2025

---

## Database & Schema

- [x] Finalize e-paper device model specs (resolution, color, refresh rate)
- [x] Confirm zone model (predefined zones vs polygons)
- [x] Define VAT invoice requirements (rates, numbering, company details)
- [x] Implement database schema (users, vehicles, devices, campaigns, billing)
- [x] Run `pnpm db:push` to apply migrations
- [x] Create database indexes for performance (status, timestamps, foreign keys)
- [ ] Write vitest tests for database queries

---

## Backend API (tRPC Procedures)

### Authentication & Authorization
- [x] Extend user table with role field (client, driver, admin)
- [x] Implement RBAC middleware (clientProcedure, driverProcedure, adminProcedure)
- [ ] Write tests for role-based access control

### Client Procedures
- [x] `client.getProfile` - Get client profile
- [x] `client.getCampaigns` - List user's campaigns
- [x] `client.getWalletBalance` - Get wallet balance
- [ ] `client.walletTopup` - Stripe integration, ledger entry
- [ ] `client.createCampaign` - Draft campaign creation
- [ ] `client.uploadAsset` - S3 upload for creatives
- [ ] `client.submitCreative` - Creative submission for approval
- [ ] `client.approveCampaign` - Client approves creative
- [ ] `client.getCampaignDetail` - Full campaign state
- [ ] `client.getInvoices` - List VAT invoices
- [ ] `client.downloadInvoicePdf` - Presigned S3 URL
- [ ] Write vitest tests for all client procedures

### Driver Procedures
- [x] `driver.getProfile` - Get driver profile
- [x] `driver.getVehicles` - List driver vehicles
- [x] `driver.getEarnings` - Payout history
- [x] `driver.getTickets` - Support ticket list
- [ ] `driver.uploadDocuments` - KYC document upload
- [ ] `driver.registerVehicle` - Vehicle registration
- [ ] `driver.scheduleInstallation` - Installation appointment request
- [ ] `driver.getDeviceStatus` - Current device state
- [ ] `driver.createTicket` - Support ticket creation
- [ ] Write vitest tests for all driver procedures

### Admin Procedures
- [x] `admin.getComplianceQueue` - Pending reviews (partial)
- [x] `admin.getTickets` - Support inbox (partial)
- [ ] `admin.approveDriver` - KYC approval/rejection
- [ ] `admin.approveVehicle` - Vehicle approval/rejection
- [ ] `admin.reviewCompliance` - Compliance queue review
- [ ] `admin.allocateCampaign` - Manual device allocation
- [ ] `admin.getDeviceFleet` - Fleet dashboard
- [ ] `admin.exportPayouts` - CSV payout export
- [ ] `admin.manageZones` - Zone CRUD operations
- [ ] Write vitest tests for all admin procedures

### Device Procedures
- [ ] `device.authenticate` - Device credential validation
- [ ] `device.getContent` - Content pull endpoint
- [ ] `device.heartbeat` - Heartbeat telemetry
- [ ] `device.reportError` - Error reporting
- [ ] Write vitest tests for device endpoints

### Billing & Invoicing
- [ ] Implement wallet ledger system (immutable transaction log)
- [ ] Create invoice generation with VAT calculation
- [ ] Implement PDF invoice generation and S3 storage
- [ ] Create daily spend calculation job
- [ ] Write vitest tests for billing logic

---

## Frontend - Client App

### Layout & Navigation
- [ ] Design client dashboard layout
- [ ] Implement navigation menu
- [ ] Create responsive design for mobile/tablet

### Wallet & Payments
- [ ] Wallet display component
- [ ] Top-up form with Stripe integration
- [ ] Transaction history view
- [ ] Write tests for wallet components

### Campaign Management
- [ ] Campaign list view
- [ ] Campaign creation form (city, zone, dates, budget)
- [ ] Campaign detail view
- [ ] Campaign status tracking
- [ ] Write tests for campaign components

### Creative Management
- [ ] Asset upload component
- [ ] Creative preview
- [ ] Creative approval workflow
- [ ] Write tests for creative components

### Invoicing
- [ ] Invoice list view
- [ ] Invoice detail view
- [ ] PDF download functionality
- [ ] Write tests for invoice components

### User Profile
- [ ] Company profile editor
- [ ] Account settings
- [ ] Logout functionality

---

## Frontend - Driver App

### Layout & Navigation
- [ ] Design driver dashboard layout
- [ ] Implement mobile-first navigation
- [ ] Create responsive design

### Onboarding & KYC
- [ ] Registration form
- [ ] Document upload (license, insurance)
- [ ] Vehicle registration form
- [ ] Installation scheduling interface
- [ ] Write tests for onboarding components

### Device Management
- [ ] Device status display
- [ ] Current campaign view
- [ ] Uptime and health metrics
- [ ] Write tests for device components

### Earnings & Payouts
- [ ] Earnings dashboard
- [ ] Payout history view
- [ ] Payout detail view
- [ ] Write tests for earnings components

### Support
- [ ] Support ticket creation form
- [ ] Ticket list view
- [ ] Ticket detail view
- [ ] Write tests for support components

---

## Frontend - Admin App

### Layout & Navigation
- [ ] Design admin dashboard with sidebar
- [ ] Implement role-based navigation
- [ ] Create responsive design

### Driver Management
- [ ] Driver list with filters
- [ ] Driver detail view
- [ ] KYC approval/rejection interface
- [ ] Document review interface
- [ ] Write tests for driver management

### Vehicle Management
- [ ] Vehicle list with filters
- [ ] Vehicle detail view
- [ ] Vehicle approval/rejection interface
- [ ] Write tests for vehicle management

### Compliance Queue
- [ ] Compliance queue list
- [ ] Creative review interface
- [ ] Campaign review interface
- [ ] Approval/rejection with reason
- [ ] Write tests for compliance components

### Device Fleet
- [ ] Fleet dashboard with status overview
- [ ] Device list with filters
- [ ] Device detail view (telemetry, heartbeat history)
- [ ] Device status indicators (online/offline)
- [ ] Write tests for fleet components

### Campaign Management
- [ ] Campaign list with status
- [ ] Campaign detail view
- [ ] Manual allocation interface (drag-drop or form)
- [ ] Write tests for campaign components

### Support Tickets
- [ ] Ticket inbox with filters
- [ ] Ticket detail view
- [ ] Ticket assignment
- [ ] Ticket resolution interface
- [ ] Write tests for support components

### Zone Management
- [ ] Zone list view
- [ ] Zone creation/edit form
- [ ] Zone pricing modifiers
- [ ] Exclusivity flag management
- [ ] Write tests for zone components

### Payout Management
- [ ] Payout list with filters
- [ ] Payout detail view
- [ ] Formula display and calculation
- [ ] CSV export functionality
- [ ] Write tests for payout components

---

## Device Agent & IoT

### Device Provisioning
- [ ] QR code generation for device provisioning
- [ ] Device credential generation and storage
- [ ] Provisioning API endpoint
- [ ] Device activation flow

### Device Communication
- [ ] Content pull endpoint implementation
- [ ] Heartbeat endpoint implementation
- [ ] Telemetry storage and retrieval
- [ ] Error reporting endpoint
- [ ] Device offline tolerance and caching

### OTA Updates (Content/Config Only)
- [ ] OTA update trigger endpoint
- [ ] Device update detection in heartbeat
- [ ] Content update delivery
- [ ] Config update delivery
- [ ] Update confirmation and logging

### Device Monitoring
- [ ] Device health dashboard
- [ ] Heartbeat monitoring and alerts
- [ ] Offline device detection
- [ ] Telemetry aggregation
- [ ] Anomaly detection for fraud prevention

---

## Integrations

### Stripe
- [ ] Wallet top-up integration
- [ ] Webhook handling for payment confirmation
- [ ] Invoice generation via Stripe (or custom PDF)
- [ ] Error handling and retry logic

### Maps (Mapbox or Google Maps)
- [ ] Zone visualization on map
- [ ] Zone polygon display
- [ ] City/zone selection interface
- [ ] Geofencing setup (Phase 2)

### Email Notifications
- [ ] Campaign approval notifications
- [ ] Payout notifications
- [ ] Support ticket notifications
- [ ] Invoice delivery emails
- [ ] Device alert emails

### Sentry (Error Tracking)
- [ ] Sentry integration setup
- [ ] Error reporting from backend
- [ ] Error reporting from frontend
- [ ] Alert configuration

---

## Testing & Quality

### Unit Tests (Vitest)
- [ ] Database query tests
- [ ] Billing logic tests
- [ ] Authorization tests
- [ ] API procedure tests
- [ ] Component tests (React)

### Integration Tests
- [ ] End-to-end campaign workflow
- [ ] End-to-end driver onboarding
- [ ] End-to-end billing and invoicing
- [ ] Device communication flow

### Manual Testing
- [ ] Client app full workflow
- [ ] Driver app full workflow
- [ ] Admin app full workflow
- [ ] Device provisioning and heartbeat
- [ ] Stripe payment flow
- [ ] PDF invoice generation

---

## Deployment & Operations

### Infrastructure
- [ ] Database setup (PostgreSQL)
- [ ] Redis setup for job queue
- [ ] S3 bucket configuration
- [ ] Environment variables configuration
- [ ] Secrets management

### CI/CD
- [ ] GitHub Actions setup
- [ ] Automated testing on PR
- [ ] Build and deployment pipeline
- [ ] Database migration automation

### Monitoring & Observability
- [ ] Sentry integration
- [ ] Basic metrics dashboard
- [ ] Alert configuration
- [ ] Log aggregation

### Documentation
- [ ] API documentation (tRPC schema)
- [ ] Database schema documentation
- [ ] Deployment guide
- [ ] Operations runbook
- [ ] Device agent documentation

---

## Compliance & Security

### Security
- [ ] HTTPS/TLS configuration
- [ ] CORS configuration
- [ ] Rate limiting
- [ ] Input validation and sanitization
- [ ] SQL injection prevention
- [ ] XSS prevention

### GDPR Compliance
- [ ] Consent tracking
- [ ] Data minimization (driver PII)
- [ ] Right-to-delete implementation
- [ ] Data retention policy
- [ ] Privacy policy

### Audit & Compliance
- [ ] Audit log implementation
- [ ] Compliance decision tracking
- [ ] Approval/rejection logging
- [ ] Audit trail for financial transactions

---

## Pilot Launch Preparation

- [ ] Finalize e-paper device model and specs
- [ ] Confirm heartbeat frequency (15-60 minutes)
- [ ] Confirm payout formula with stakeholders
- [ ] Prepare pilot cities (Riga, Amsterdam)
- [ ] Recruit pilot drivers and clients
- [ ] Prepare device fleet for pilot
- [ ] Create user documentation
- [ ] Conduct internal testing
- [ ] Soft launch with pilot users
- [ ] Monitor and iterate based on feedback

---

## Known Issues & Blockers

- [ ] E-paper device model specs pending (blocks device agent development)
- [ ] Heartbeat frequency not finalized (affects telemetry schema)
- [ ] Payout formula not finalized (affects earnings calculation)
- [ ] VAT invoice requirements not confirmed (affects billing)
- [ ] Zone model not finalized (affects campaign allocation)

---

## Notes

- **Pilot MVP Scope:** Web apps only (client, admin); driver mobile app moves to Phase 2
- **Manual Workflows:** Admin-driven allocation, payout, and compliance review
- **Device OTA:** Content/config updates only; firmware OTA moves to Phase 2
- **Zone Enforcement:** Soft enforcement in Pilot; hard enforcement (geofencing) in Phase 2+
- **Payout Automation:** Limited to simple formula + manual review; full automation in Phase 2
- **Support:** Ticketing only; real-time chat moves to Phase 2


---

## Current Sprint: Client Campaign Creation UI

- [x] Extend backend: Complete `client.createCampaign` procedure
- [x] Extend backend: Implement `client.uploadAsset` for S3 upload
- [x] Extend backend: Implement `client.submitCreative` for approval
- [x] Extend backend: Implement `client.getCampaignDetail` with creative status
- [x] Extend backend: Implement `client.approveCreative` for client approval
- [x] Frontend: Create client dashboard layout with navigation
- [x] Frontend: Build campaign list view with status badges
- [x] Frontend: Build campaign creation form modal
- [x] Frontend: Implement creative upload component with preview
- [x] Frontend: Build campaign detail view with approval workflow
- [x] Frontend: Add wallet balance display
- [x] Frontend: Write tests for campaign creation flow
- [x] Mark all completed items as [x] in todo.md


---

## Current Sprint: Admin Compliance Dashboard

- [x] Extend backend: Implement `admin.getComplianceQueue` with filters and pagination
- [x] Extend backend: Implement `admin.reviewCreative` for approval/rejection
- [x] Extend backend: Implement `admin.approveCampaign` to activate campaign
- [x] Extend backend: Implement `admin.rejectCampaign` with reason tracking
- [x] Extend backend: Implement `admin.getComplianceStats` for dashboard overview
- [x] Frontend: Create admin dashboard layout with sidebar navigation
- [x] Frontend: Build compliance queue list with filtering (status, date, client)
- [x] Frontend: Build creative preview modal with full details
- [x] Frontend: Implement approval/rejection form with reason input
- [x] Frontend: Add compliance stats cards (pending, approved, rejected)
- [ ] Frontend: Build audit trail view for compliance history
- [x] Frontend: Write tests for admin approval procedures
- [x] Mark all completed items as [x] in todo.md


---

## Current Sprint: Fleet Management Dashboard

- [x] Extend backend: Implement `admin.getFleetOverview` for dashboard stats
- [x] Extend backend: Implement `admin.getDevices` with filtering and pagination
- [x] Extend backend: Implement `admin.getDeviceTelemetry` for real-time metrics
- [x] Extend backend: Implement `admin.allocateCampaign` to assign campaign to device
- [x] Extend backend: Implement `admin.deallocateCampaign` to remove campaign from device
- [x] Extend backend: Implement `admin.getDeviceDetail` with full device information
- [x] Frontend: Create fleet management page with device list
- [x] Frontend: Build device detail modal with telemetry display
- [x] Frontend: Implement campaign allocation form
- [x] Frontend: Add device status indicators (online, offline, low battery)
- [x] Frontend: Build fleet overview stats (total devices, online, active campaigns)
- [x] Frontend: Add real-time telemetry refresh (battery, signal, uptime)
- [x] Frontend: Write tests for fleet management procedures
- [x] Mark all completed items as [x] in todo.md
