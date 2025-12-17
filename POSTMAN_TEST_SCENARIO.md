# Postman Test Scenario: Complete Subscription & Service Flow

This document provides step-by-step testing scenarios for the complete subscription lifecycle including membership creation, billing, invoices, notifications, quota consumption, and call requests.

## Prerequisites

- Server running on `http://localhost:3000`
- Valid JWT token for authentication (if auth is enabled)
- Database with Prisma migrations applied
- Seed data for services (CONSULTATION, LEGAL_OPINION, etc.)

## Base URL
```
{{BASE_URL}} = http://localhost:3000
```

## Environment Variables
```json
{
    "BASE_URL": "http://localhost:3000",
    "USER_ID": "",
    "TIER_ID": "",
    "MEMBERSHIP_ID": "",
    "INVOICE_ID": "",
    "PAYMENT_ID": "",
    "CALL_REQUEST_ID": "",
    "PROVIDER_ID": ""
}
```

---

# SCENARIO 1: Complete Membership & Quota Flow

## Flow Diagram
```
1. Create User (if needed)
        ↓
2. Create Membership Tier with Quota
        ↓
3. Create Membership for User
        ↓
4. Create Invoice
        ↓
5. Process Payment
        ↓
6. Check Quota Status
        ↓
7. Consume Quota
        ↓
8. Verify Quota Updated
        ↓
9. Check Notifications
```

---

## Step 1: Create User (If Needed)

### Request
```http
POST {{BASE_URL}}/users
Content-Type: application/json
```

### Body
```json
{
    "email": "testuser@example.com",
    "username": "testuser",
    "fullName": "Test User"
}
```

### Expected Response
```json
{
    "user": {
        "id": "f48e0ddc-3679-4580-a81e-a88667223cdf",
        "email": "testuser@example.com",
        "username": "testuser"
    }
}
```

**Save `user.id` as `{{USER_ID}}`**

---

## Step 2: Create Membership Tier with Quota

### Request
```http
POST {{BASE_URL}}/memberships/tiers
Content-Type: application/json
```

### Body (Use correct field names!)
```json
{
    "name": "Premium Plan",
    "nameAr": "الخطة المميزة",
    "description": "Premium membership with full access to legal services",
    "descriptionAr": "عضوية مميزة مع وصول كامل للخدمات القانونية",
    "price": 500,
    "currency": "SAR",
    "billingCycle": "monthly",
    "quota": {
        "consultationsPerMonth": 10,
        "opinionsPerMonth": 5,
        "casesPerMonth": 2,
        "callMinutesPerMonth": 60
    },
    "benefits": [
        "Priority support",
        "Document storage",
        "Video consultations"
    ],
    "isActive": true
}
```

> **Note:** You can also use user-friendly names:
> - `consultations` → `consultationsPerMonth`
> - `legalOpinions` → `opinionsPerMonth`
> - `litigationCases` → `casesPerMonth`
> - `callMinutes` → `callMinutesPerMonth`

### Expected Response
```json
{
    "tier": {
        "id": 1,
        "name": "Premium Plan",
        "quota": {
            "consultationsPerMonth": 10,
            "opinionsPerMonth": 5,
            "casesPerMonth": 2,
            "callMinutesPerMonth": 60
        }
    }
}
```

**Save `tier.id` as `{{TIER_ID}}`**

---

## Step 3: Create Membership for User

### Request
```http
POST {{BASE_URL}}/memberships
Content-Type: application/json
```

### Body
```json
{
    "userId": "{{USER_ID}}",
    "tierId": {{TIER_ID}},
    "durationInMonths": 12,
    "autoRenew": true
}
```

### Expected Response
```json
{
    "membership": {
        "id": "abc123-def456-...",
        "userId": "{{USER_ID}}",
        "tierId": 1,
        "isActive": true,
        "autoRenew": true,
        "startDate": "2025-12-17T...",
        "endDate": "2026-12-17T..."
    }
}
```

**Save `membership.id` as `{{MEMBERSHIP_ID}}`**

---

## Step 4: Create Invoice for Membership

### Request
```http
POST {{BASE_URL}}/billing/invoices
Content-Type: application/json
```

### Body
```json
{
    "membershipId": "{{MEMBERSHIP_ID}}",
    "amount": 500,
    "currency": "SAR",
    "dueDate": "2025-12-31",
    "description": "Monthly subscription - Premium Plan"
}
```

### Expected Response
```json
{
    "invoice": {
        "id": "inv-123...",
        "membershipId": "{{MEMBERSHIP_ID}}",
        "amount": 500,
        "currency": "SAR",
        "status": "pending"
    }
}
```

**Save `invoice.id` as `{{INVOICE_ID}}`**

---

## Step 5: Process Payment

### Request
```http
POST {{BASE_URL}}/memberships/{{MEMBERSHIP_ID}}/payments
Content-Type: application/json
```

### Body
```json
{
    "invoiceId": "{{INVOICE_ID}}",
    "provider": "stripe",
    "amount": 500,
    "currency": "SAR"
}
```

### Expected Response
```json
{
    "payment": {
        "id": "pay-123...",
        "invoiceId": "{{INVOICE_ID}}",
        "status": "pending",
        "provider": "stripe"
    }
}
```

**Save `payment.id` as `{{PAYMENT_ID}}`**

### Complete Payment (Webhook Simulation)
```http
POST {{BASE_URL}}/memberships/payments/{{PAYMENT_ID}}/complete
Content-Type: application/json
```

### Body
```json
{
    "providerTxnId": "txn_stripe_123456"
}
```

---

## Step 6: Check Quota Status (Before Consumption)

### Request
```http
GET {{BASE_URL}}/memberships/{{MEMBERSHIP_ID}}/quota/consultations
```

### Expected Response
```json
{
    "quota": {
        "used": 0,
        "limit": 10,
        "remaining": 10
    }
}
```

---

## Step 7: Consume Quota

### Request
```http
PUT {{BASE_URL}}/memberships/{{MEMBERSHIP_ID}}/quota/consultations/consume
Content-Type: application/json
```

### Body
```json
{
    "amount": 1
}
```

### Expected Response
```json
{
    "message": "Successfully consumed 1 consultations"
}
```

---

## Step 8: Verify Quota Updated

### Request
```http
GET {{BASE_URL}}/memberships/{{MEMBERSHIP_ID}}/quota/consultations
```

### Expected Response
```json
{
    "quota": {
        "used": 1,
        "limit": 10,
        "remaining": 9
    }
}
```

---

## Step 9: Check Notifications

### Request
```http
GET {{BASE_URL}}/notifications/user/{{USER_ID}}
```

### Expected Response
```json
{
    "notifications": [
        {
            "id": "...",
            "type": "PAYMENT_RECEIVED",
            "title": "Payment Successful",
            "message": "Your payment of 500 SAR has been received",
            "isRead": false
        }
    ]
}
```

---

# SCENARIO 2: Complete Call Request Flow

## Flow Diagram
```
1. Create Call Request
        ↓
2. Assign Provider
        ↓
3. Schedule Call
        ↓
4. Start Call
        ↓
5. End Call
        ↓
6. Verify Call Minutes Consumed
```

---

## Step 1: Create Call Request

### Request
```http
POST {{BASE_URL}}/call-requests
Content-Type: application/json
```

### Body
```json
{
    "subscriberId": "{{USER_ID}}",
    "purpose": "Legal consultation regarding property dispute",
    "consultationType": "legal_advice",
    "preferredDate": "2025-12-20",
    "preferredTime": "14:00"
}
```

### Expected Response
```json
{
    "callRequest": {
        "id": "call-123...",
        "requestNumber": "CALL-ABC123-XYZ",
        "subscriberId": "{{USER_ID}}",
        "status": "pending",
        "purpose": "Legal consultation regarding property dispute"
    }
}
```

**Save `callRequest.id` as `{{CALL_REQUEST_ID}}`**

---

## Step 2: Assign Provider to Call

### Request
```http
POST {{BASE_URL}}/call-requests/{{CALL_REQUEST_ID}}/assign
Content-Type: application/json
```

### Body
```json
{
    "providerId": "{{PROVIDER_ID}}"
}
```

### Expected Response
```json
{
    "callRequest": {
        "id": "{{CALL_REQUEST_ID}}",
        "assignedProviderId": "{{PROVIDER_ID}}",
        "status": "assigned"
    }
}
```

---

## Step 3: Schedule the Call

### Request
```http
POST {{BASE_URL}}/call-requests/{{CALL_REQUEST_ID}}/schedule
Content-Type: application/json
```

### Body
```json
{
    "scheduledAt": "2025-12-20T14:00:00Z",
    "durationMinutes": 30,
    "platform": "zoom",
    "callLink": "https://zoom.us/j/123456789"
}
```

### Expected Response
```json
{
    "callRequest": {
        "id": "{{CALL_REQUEST_ID}}",
        "status": "scheduled",
        "scheduledAt": "2025-12-20T14:00:00.000Z",
        "scheduledDuration": 30,
        "callPlatform": "zoom",
        "callLink": "https://zoom.us/j/123456789"
    }
}
```

---

## Step 4: Start the Call

### Request
```http
POST {{BASE_URL}}/call-requests/{{CALL_REQUEST_ID}}/start
```

### Expected Response
```json
{
    "callRequest": {
        "id": "{{CALL_REQUEST_ID}}",
        "status": "in_progress",
        "callStartedAt": "2025-12-20T14:00:00.000Z"
    }
}
```

---

## Step 5: End the Call

### Request
```http
POST {{BASE_URL}}/call-requests/{{CALL_REQUEST_ID}}/end
Content-Type: application/json
```

### Body
```json
{
    "recordingUrl": "https://storage.example.com/recordings/call-123.mp4"
}
```

### Expected Response
```json
{
    "callRequest": {
        "id": "{{CALL_REQUEST_ID}}",
        "status": "completed",
        "callStartedAt": "2025-12-20T14:00:00.000Z",
        "callEndedAt": "2025-12-20T14:25:00.000Z",
        "actualDuration": 25,
        "recordingUrl": "https://storage.example.com/recordings/call-123.mp4"
    }
}
```

---

## Step 6: Verify Call Minutes Consumed

### Request
```http
GET {{BASE_URL}}/memberships/{{MEMBERSHIP_ID}}/quota/callMinutes
```

### Expected Response
```json
{
    "quota": {
        "used": 25,
        "limit": 60,
        "remaining": 35
    }
}
```

---

# SCENARIO 3: Membership Upgrade Flow

## Flow Diagram
```
1. Get Current Membership
        ↓
2. View Available Tiers
        ↓
3. Upgrade Membership
        ↓
4. Verify New Quota Limits
```

---

## Step 1: Get Current Membership

### Request
```http
GET {{BASE_URL}}/memberships/user/{{USER_ID}}
```

### Expected Response
```json
{
    "membership": {
        "id": "{{MEMBERSHIP_ID}}",
        "tierId": 1,
        "isActive": true
    }
}
```

---

## Step 2: View Available Tiers

### Request
```http
GET {{BASE_URL}}/memberships/tiers
```

### Expected Response
```json
{
    "tiers": [
        {
            "id": 1,
            "name": "Premium Plan",
            "price": 500
        },
        {
            "id": 2,
            "name": "Enterprise Plan",
            "price": 1000
        }
    ]
}
```

---

## Step 3: Upgrade Membership to Enterprise

### Request
```http
POST {{BASE_URL}}/memberships/{{MEMBERSHIP_ID}}/upgrade
Content-Type: application/json
```

### Body
```json
{
    "newTierId": 2
}
```

### Expected Response
```json
{
    "result": {
        "membership": {
            "id": "{{MEMBERSHIP_ID}}",
            "tierId": 2
        },
        "changeLog": {
            "oldTierId": 1,
            "newTierId": 2,
            "changeType": "upgrade"
        }
    }
}
```

---

## Step 4: Verify New Quota Limits

### Request
```http
GET {{BASE_URL}}/memberships/{{MEMBERSHIP_ID}}/quota/consultations
```

### Expected Response
```json
{
    "quota": {
        "used": 1,
        "limit": 20,
        "remaining": 19
    }
}
```

---

# Additional Endpoints Reference

## Call Request Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/call-requests` | Create call request |
| GET | `/call-requests` | List all (with filters) |
| GET | `/call-requests/:id` | Get by ID |
| DELETE | `/call-requests/:id` | Cancel call |
| POST | `/call-requests/:id/assign` | Assign provider |
| POST | `/call-requests/:id/schedule` | Schedule call |
| POST | `/call-requests/:id/reschedule` | Reschedule |
| PATCH | `/call-requests/:id/call-link` | Update call link |
| POST | `/call-requests/:id/start` | Start call |
| POST | `/call-requests/:id/end` | End call |
| POST | `/call-requests/:id/no-show` | Mark no-show |
| GET | `/call-requests/subscriber/:id` | Subscriber's calls |
| GET | `/call-requests/subscriber/:id/minutes` | Minutes summary |
| GET | `/call-requests/provider/:id` | Provider's calls |
| GET | `/call-requests/provider/:id/upcoming` | Upcoming calls |
| GET | `/call-requests/provider/:id/availability` | Check availability |
| GET | `/call-requests/admin/overdue` | Overdue calls |
| GET | `/call-requests/admin/scheduled` | Scheduled calls |

## Membership Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/memberships` | Create membership |
| GET | `/memberships/me` | Get my membership |
| GET | `/memberships/:id` | Get by ID |
| DELETE | `/memberships/:id` | Cancel |
| POST | `/memberships/:id/renew` | Renew |
| PATCH | `/memberships/:id/auto-renew` | Toggle auto-renew |
| GET | `/memberships/:id/quota/:resource` | Check quota |
| PUT | `/memberships/:id/quota/:resource/consume` | Consume quota |
| POST | `/memberships/:id/upgrade` | Upgrade tier |
| POST | `/memberships/:id/downgrade` | Downgrade tier |
| POST | `/memberships/:id/pause` | Pause |
| POST | `/memberships/:id/resume` | Resume |
| GET | `/memberships/:id/status` | Check status |
| GET | `/memberships/:id/change-history` | Change history |

## Tier Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/memberships/tiers` | List all tiers |
| GET | `/memberships/tiers/:id` | Get tier by ID |
| POST | `/memberships/tiers` | Create tier |
| PUT | `/memberships/tiers/:id` | Update tier |
| DELETE | `/memberships/tiers/:id` | Delete tier |

## Quota Resource Names

Use these in the URL parameter `:resource`:
- `consultations` or `consultationsPerMonth`
- `opinions` or `legalOpinions` or `opinionsPerMonth`
- `services` or `servicesPerMonth`
- `cases` or `litigationCases` or `casesPerMonth`
- `callMinutes` or `callMinutesPerMonth`

---

# Troubleshooting

## Common Errors

### "User already has an active membership"
- User already has a membership. Use upgrade instead of create, or cancel existing first.

### "Membership not found"
- Check the membership ID is correct
- Ensure the membership wasn't deleted

### "Quota limit is null"
- The tier doesn't have quota configured
- Create tier with proper quota fields (use `consultationsPerMonth`, not `consultations`)

### "Provider not available"
- Provider has conflicting calls at the requested time
- Use `/call-requests/provider/:id/availability` to check availability first

### "Cannot start call - not scheduled"
- Call must be in "scheduled" status before starting
- Ensure the call has been scheduled first
