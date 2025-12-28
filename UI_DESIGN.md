# Vehiclee-PaperAdsSaaS: UI/UX Design Document

**Author:** Kashif Shoukat 
**Date:** December 2025  
**Phase:** Pilot MVP  
**Design System:** Tailwind CSS 4 + shadcn/ui

---

## Design Philosophy

The Vehiclee-PaperAdsSaaS platform serves three distinct user personas with different goals and technical proficiency levels. The UI design prioritizes **clarity, efficiency, and trust** across all interfaces:

- **Clients (Advertisers):** Need confidence in campaign performance and transparent billing
- **Drivers:** Need simple, mobile-friendly interfaces for onboarding and earnings tracking
- **Admins:** Need comprehensive dashboards for operational oversight and compliance management

The design system uses a **professional, data-driven aesthetic** with clear information hierarchy, consistent spacing, and accessible color contrasts. All interfaces follow mobile-first responsive design principles.

---

## Color Palette & Typography

### Colors

The platform uses a **cool, professional palette** that conveys trust and operational clarity:

| Element | Color | Usage |
|---------|-------|-------|
| **Primary** | `#0066CC` (Blue) | CTAs, active states, primary actions |
| **Success** | `#10B981` (Green) | Approvals, active devices, positive states |
| **Warning** | `#F59E0B` (Amber) | Pending reviews, caution states |
| **Danger** | `#EF4444` (Red) | Rejections, errors, critical alerts |
| **Neutral** | `#6B7280` (Gray) | Secondary text, disabled states |
| **Background** | `#FFFFFF` (White) | Primary background |
| **Surface** | `#F9FAFB` (Light Gray) | Cards, panels, secondary backgrounds |

### Typography

- **Headings:** Inter (sans-serif), weights 600-700, sizes 24px-32px
- **Body:** Inter (sans-serif), weight 400, size 14px-16px
- **Monospace:** Fira Code (for device IDs, transaction hashes), size 12px-14px

---

## Layout Architecture

### Client App (Web)

The client application uses a **top navigation + content layout** suitable for campaign management and financial tracking.

```
┌─────────────────────────────────────────────────────────────┐
│  Vehiclee Logo  │  Dashboard  │  Campaigns  │  Invoices  │ Profile ▼
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [Main Content Area]                                        │
│                                                             │
│  - Dashboard: Wallet balance, active campaigns, quick stats │
│  - Campaigns: Create, view, manage campaigns               │
│  - Invoices: Download VAT invoices                         │
│  - Profile: Company info, account settings                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Driver App (Mobile-Optimized Web)

The driver application uses a **bottom tab navigation** optimized for mobile devices.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [Main Content Area]                                        │
│                                                             │
│  - Dashboard: Device status, current campaign              │
│  - Earnings: Payout history, active earnings              │
│  - Support: Create/view tickets                            │
│  - Profile: Account, documents, vehicle info              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  🏠 Dashboard  │  💰 Earnings  │  🎫 Support  │  👤 Profile  │
└─────────────────────────────────────────────────────────────┘
```

### Admin App (Web)

The admin application uses a **persistent sidebar + main content layout** for comprehensive operational oversight.

```
┌────────────────┬──────────────────────────────────────────┐
│                │  Dashboard  │  Drivers  │  Campaigns  │ ⚙️ │
│  Vehiclee      ├──────────────────────────────────────────┤
│  Logo          │                                          │
│                │  [Main Content Area]                     │
│  Dashboard     │                                          │
│  Drivers       │  - Dashboard: Fleet status, alerts       │
│  Vehicles      │  - Drivers: Approval queue, profiles     │
│  Campaigns     │  - Campaigns: Allocation, status        │
│  Compliance    │  - Compliance: Review queue             │
│  Devices       │  - Devices: Fleet health, telemetry     │
│  Payouts       │  - Payouts: Earnings, export            │
│  Support       │  - Support: Ticket inbox                │
│  Zones         │  - Zones: Configuration                 │
│  Logout        │                                          │
│                │                                          │
└────────────────┴──────────────────────────────────────────┘
```

---

## Client App: Detailed Screens

### 1. Dashboard

**Purpose:** Provide at-a-glance overview of wallet, active campaigns, and recent activity.

**Key Components:**
- **Wallet Card:** Current balance (large, prominent), top-up button
- **Active Campaigns:** Quick list with status indicators (draft, pending, active, completed)
- **Recent Transactions:** Last 5 wallet transactions with amounts and dates
- **Quick Stats:** Total spent this month, active campaigns count, invoices pending

**Responsive Behavior:** On mobile, stack cards vertically; on desktop, use 2-column grid.

### 2. Campaigns Page

**Purpose:** Create, manage, and track advertising campaigns.

**Sections:**
- **Campaign List:** Table with columns: Name, City, Status, Start Date, End Date, Budget, Actions
- **Create Campaign Button:** Opens modal/form with fields:
  - Campaign name
  - Description
  - City (dropdown)
  - Zone (soft selection, optional)
  - Start date (date picker)
  - End date (date picker)
  - Number of cars (input)
  - Daily budget (input with currency)
  - Total budget (auto-calculated)
- **Campaign Detail View:** Shows full campaign state, creative status, allocation progress

**Status Badges:**
- `Draft` (gray) - Not yet submitted
- `Awaiting Creative` (amber) - Waiting for asset upload
- `Awaiting Approval` (amber) - Compliance review pending
- `Approved` (blue) - Ready to launch
- `Active` (green) - Currently running
- `Completed` (gray) - Campaign finished
- `Cancelled` (red) - Campaign cancelled

### 3. Creative Management

**Purpose:** Upload, preview, and approve ad creatives.

**Workflow:**
1. Client uploads asset (image file, ~2MB max)
2. System shows preview on e-paper resolution (e.g., 800x480)
3. Client submits brief/description
4. System shows "Awaiting Compliance Approval" status
5. Admin reviews and approves/rejects
6. Client receives notification and can proceed or revise

**Components:**
- **Asset Upload:** Drag-drop zone or file picker
- **Preview:** Renders image at device resolution with border
- **Brief Text:** Text area for campaign brief
- **Status Indicator:** Shows approval state with timeline

### 4. Invoices Page

**Purpose:** View and download VAT invoices.

**Components:**
- **Invoice List:** Table with columns: Invoice #, Date, Amount, VAT, Total, Status, Action
- **Download Button:** Generates presigned S3 URL, triggers PDF download
- **Invoice Detail:** Shows line items, VAT calculation, company details

**Status Badges:**
- `Draft` (gray)
- `Sent` (blue)
- `Paid` (green)
- `Overdue` (red)
- `Cancelled` (gray)

### 5. Wallet & Top-Up

**Purpose:** Manage wallet balance and fund campaigns.

**Components:**
- **Current Balance:** Large, prominent display
- **Top-Up Form:** Amount input, Stripe payment button
- **Transaction History:** Full ledger with filters (date range, type)
- **Recurring Top-Up:** Option to auto-top-up at threshold (Phase 2)

---

## Driver App: Detailed Screens

### 1. Dashboard

**Purpose:** Show current device status and active campaign.

**Key Components:**
- **Device Status Card:** 
  - Device ID (masked or last 4 digits)
  - Current status (online/offline)
  - Last heartbeat time
  - Battery level (if available)
  - Signal strength (if available)
- **Active Campaign Card:**
  - Campaign name
  - Advertiser name
  - Start/end dates
  - Current day of campaign
  - Progress bar
- **Quick Actions:** View earnings, create support ticket

**Mobile Optimization:** Full-width cards, large touch targets.

### 2. Onboarding Flow

**Purpose:** Guide new drivers through registration and approval.

**Steps:**

**Step 1: Personal Information**
- Full name
- Email
- Phone number
- Accept terms & conditions

**Step 2: Document Upload**
- Driver's license (photo/scan)
- Insurance document (optional)
- Proof of address (optional)
- Status: "Pending Admin Review"

**Step 3: Vehicle Registration**
- License plate
- Make/model
- Year
- Color
- Status: "Pending Admin Review"

**Step 4: Installation Scheduling**
- Preferred installation date (date picker)
- Preferred time slot (dropdown)
- Address confirmation
- Status: "Awaiting Admin Approval"

**Step 5: Confirmation**
- "Your application is under review"
- "We'll notify you when approved"
- Link to support if questions

### 3. Device Status

**Purpose:** Monitor device health and display performance.

**Components:**
- **Device Information:**
  - Device ID
  - Model
  - Resolution
  - Color mode
  - Firmware version
- **Health Metrics:**
  - Last heartbeat (timestamp)
  - Uptime % (today, week, month)
  - Battery level (if available)
  - Signal strength (if available)
- **Current Content:**
  - Preview of current image displayed
  - Content hash
  - Last update time
- **Telemetry Graph:** Line chart showing uptime over last 7 days

### 4. Earnings Page

**Purpose:** Track payouts and earnings history.

**Components:**
- **Current Earnings:** Large display of pending/approved earnings
- **Payout List:** Table with columns: Campaign, Period, Formula, Amount, Status, Date
- **Payout Detail:** Shows calculation breakdown:
  - Active days: X
  - Daily rate: €Y
  - Average uptime: Z%
  - Total: €(X × Y × Z/100)
- **Payment Method:** Bank account on file (Phase 2)

### 5. Support Tickets

**Purpose:** Create and track support requests.

**Components:**
- **Create Ticket Button:** Opens form with fields:
  - Ticket type (dropdown: device issue, payment issue, other)
  - Subject
  - Description
  - Attachments (optional)
- **Ticket List:** Shows open/resolved tickets with status
- **Ticket Detail:** Shows conversation thread, status, resolution

---

## Admin App: Detailed Screens

### 1. Dashboard

**Purpose:** Operational overview and alerts.

**Key Components:**
- **Fleet Status Card:**
  - Total devices: X
  - Online: Y (green)
  - Offline: Z (red)
  - Last 24h heartbeats: Graph
- **Pending Actions Card:**
  - Drivers awaiting approval: X
  - Vehicles awaiting approval: Y
  - Compliance reviews pending: Z
  - Support tickets open: W
- **Recent Activity:** Timeline of approvals, rejections, allocations
- **Alerts:** Critical alerts (e.g., device fleet degradation, payment failures)

### 2. Driver Management

**Purpose:** Approve/reject drivers and manage KYC.

**Components:**
- **Driver List:** Table with columns: Name, Status, Email, Phone, Submitted Date, Actions
- **Status Filters:** Pending, Approved, Rejected
- **Driver Detail View:**
  - Personal information
  - Uploaded documents (preview)
  - Document review interface with approve/reject buttons
  - Reason for rejection (if rejected)
  - Audit trail (who reviewed, when)
- **Bulk Actions:** Approve multiple drivers (Phase 2)

### 3. Vehicle Management

**Purpose:** Approve/reject vehicles and manage fleet.

**Components:**
- **Vehicle List:** Table with columns: License Plate, Driver, Make/Model, Status, Submitted Date, Actions
- **Status Filters:** Pending, Approved, Rejected
- **Vehicle Detail View:**
  - Vehicle information
  - Driver information (link to driver profile)
  - Approval/rejection interface
  - Audit trail

### 4. Compliance Queue

**Purpose:** Review creatives and campaigns for policy compliance.

**Components:**
- **Queue List:** Table with columns: Entity Type, Entity Name, Submitted Date, Status, Actions
- **Status Filters:** Pending, Approved, Rejected, Escalated
- **Review Interface:**
  - Creative preview (full resolution)
  - Campaign details
  - Restricted categories checklist
  - Approval/rejection buttons with reason field
  - Escalation option (for complex cases)

### 5. Campaign Allocation

**Purpose:** Manually allocate devices to campaigns.

**Components:**
- **Campaign Selection:** Dropdown or search
- **Campaign Details:** Start date, end date, number of cars needed
- **Device Selection:** 
  - List of available devices with status
  - Filter by city, zone, status
  - Multi-select checkboxes
- **Allocation Summary:** Shows selected devices, date range
- **Confirm Allocation:** Button to finalize

**Alternative UI (Phase 2):** Drag-drop interface for visual allocation.

### 6. Device Fleet Dashboard

**Purpose:** Monitor device health and telemetry.

**Components:**
- **Fleet Overview:**
  - Total devices: X
  - Status breakdown: Online (Y), Offline (Z), Error (W)
  - Average uptime: Z%
  - Last heartbeat: Timestamp
- **Device List:** Table with columns: Device ID, Vehicle (License Plate), Status, Last Heartbeat, Uptime %, Battery, Actions
- **Device Detail View:**
  - Device information (ID, model, resolution, firmware)
  - Current campaign (if allocated)
  - Telemetry graph (uptime, battery, signal over time)
  - Heartbeat history (last 10 with timestamps)
  - Error log (if any)
- **Filters:** Status, city, campaign, date range

### 7. Support Tickets

**Purpose:** Manage customer support requests.

**Components:**
- **Ticket Inbox:** Table with columns: Ticket #, User, Type, Subject, Priority, Status, Created, Actions
- **Filters:** Status, priority, type, date range
- **Ticket Detail View:**
  - User information
  - Ticket details
  - Conversation thread
  - Assignment dropdown
  - Resolution text area
  - Close ticket button
- **Priority Badges:** Low (gray), Medium (blue), High (amber), Urgent (red)

### 8. Payout Management

**Purpose:** Review and export driver payouts.

**Components:**
- **Payout List:** Table with columns: Driver, Campaign, Period, Formula, Amount, Status, Actions
- **Status Filters:** Pending, Approved, Paid, Disputed
- **Payout Detail View:**
  - Driver information
  - Campaign information
  - Calculation breakdown (active days, daily rate, uptime %, total)
  - Approval/rejection interface
  - Audit trail
- **Export Button:** Generates CSV for manual payment processing

### 9. Zone Management

**Purpose:** Configure zones and pricing.

**Components:**
- **Zone List:** Table with columns: City, Zone Name, Price Modifier, Exclusivity, Actions
- **Create/Edit Zone Form:**
  - City (dropdown)
  - Zone name
  - Polygon GeoJSON (map picker, Phase 2)
  - Price modifier (decimal, e.g., 0.8 for 20% discount)
  - Exclusivity flag (checkbox)
  - Save/Cancel buttons
- **Map Preview:** Shows zone polygon (Phase 2)

---

## Component Library (shadcn/ui)

The design leverages pre-built shadcn/ui components for consistency and speed:

| Component | Usage |
|-----------|-------|
| **Button** | All CTAs, actions, form submissions |
| **Card** | Dashboard cards, campaign cards, device cards |
| **Table** | Lists (drivers, vehicles, campaigns, devices, payouts) |
| **Dialog** | Modals for forms (create campaign, allocate device) |
| **Form** | All input forms (registration, profile, settings) |
| **Input** | Text fields, number fields, date pickers |
| **Select** | Dropdowns (city, zone, status filters) |
| **Badge** | Status indicators (approved, pending, active, etc.) |
| **Tabs** | Multi-section pages (campaign detail, device detail) |
| **Alert** | Notifications, warnings, errors |
| **Skeleton** | Loading states for data-heavy pages |
| **Toast** | Confirmations, errors (Sonner) |

---

## Responsive Design Breakpoints

The design follows Tailwind CSS breakpoints:

| Breakpoint | Width | Usage |
|-----------|-------|-------|
| **Mobile** | 320px - 640px | Driver app primary target |
| **Tablet** | 640px - 1024px | Responsive views |
| **Desktop** | 1024px+ | Admin app primary target |

**Mobile-First Approach:** Start with mobile layout, enhance for larger screens.

---

## Accessibility & Usability

**Color Contrast:** All text meets WCAG AA standards (4.5:1 for body, 3:1 for large text).

**Focus States:** Visible focus rings on all interactive elements for keyboard navigation.

**Form Labels:** All inputs have associated labels; placeholders are not used as labels.

**Error Messages:** Clear, actionable error messages displayed inline with form fields.

**Loading States:** Skeleton screens and spinners indicate data loading; no blank pages.

**Empty States:** Friendly messages with CTAs when lists are empty.

---

## Interaction Patterns

### Approval Workflows

All approval workflows follow a consistent pattern:

1. **Pending State:** Item appears in queue with "Review" button
2. **Review Interface:** Full details displayed with approve/reject options
3. **Decision:** Admin selects approve/reject with optional reason
4. **Confirmation:** Toast notification confirms action
5. **Audit Trail:** Decision logged with timestamp and reviewer attribution

### Data Loading

- **Initial Load:** Skeleton screen while fetching data
- **Pagination:** Tables support pagination (10, 25, 50 items per page)
- **Infinite Scroll:** Mobile lists use infinite scroll (Phase 2)
- **Filters:** Real-time filtering with debounce (500ms)

### Error Handling

- **Network Errors:** Toast notification with retry button
- **Validation Errors:** Inline error messages below form fields
- **Server Errors:** Modal dialog with error details and support contact
- **Conflict Errors:** Clear message explaining conflict (e.g., "Device already allocated")

---

## Design Tokens (Tailwind CSS 4)

The design system uses CSS variables for theming:

```css
@theme {
  --color-primary: #0066CC;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
  --color-neutral: #6B7280;
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
}
```

---

## Conclusion

This UI/UX design provides a **professional, efficient interface** for all three user roles in the Vehiclee-PaperAdsSaaS platform. The design prioritizes clarity, accessibility, and mobile-first responsiveness, enabling clients to manage campaigns confidently, drivers to track earnings easily, and admins to oversee operations comprehensively. By leveraging shadcn/ui components and Tailwind CSS, the implementation can proceed rapidly while maintaining design consistency and quality.

