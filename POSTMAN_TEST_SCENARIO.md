# Postman Test Scenario: Subscription, Billing, Invoice, Notification & Quota Flow

This document provides a step-by-step testing scenario for the complete subscription lifecycle including membership creation, billing, invoices, notifications, and quota consumption.

## Prerequisites

- Server running on `http://localhost:3000`
- Valid JWT token for authentication (if auth is enabled)
- Database with Prisma migrations applied

## Base URL
```
{{BASE_URL}} = http://localhost:3000
```

---

## Test Scenario Flow

```
1. Create Membership Tier (Admin)
        ↓
2. Create Membership for User
        ↓
3. Create Billing Invoice
        ↓
4. Process Payment
        ↓
5. Consume Quota (Service Usage)
        ↓
6. Check Notifications
        ↓
7. Check Quota Status
```

---

## Step 1: Create Membership Tier (Admin Setup)

First, we need a membership tier that users can subscribe to.

### Request
```
POST {{BASE_URL}}/memberships/tiers
Content-Type: application/json
```

### Body
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
        "consultations": 10,
        "legalOpinions": 5,
        "litigationCases": 2,
        "storage": 5120
    },
    "benefits": [
        "Unlimited consultations",
        "Priority support",
        "Document storage"
    ],
    "isActive": true
}
```

### Expected Response
```json
{
    "tier": {
        "id": 1,
        "name": "Premium Plan",
        "nameAr": "الخطة المميزة",
        "description": "Premium membership with full access to legal services",
        "price": 500,
        "currency": "SAR",
        "billingCycle": "monthly",
        "isActive": true
    }
}
```

**Save the `tier.id` for the next step!**

---

## Step 2: Create Membership for User

Create a subscription/membership for a user using the tier created above.

### Request
```
POST {{BASE_URL}}/memberships
Content-Type: application/json
Authorization: Bearer {{JWT_TOKEN}}
```

### Body
```json
{
    "userId": "user-123-uuid",
    "tierId": 1,
    "durationInMonths": 12,
    "autoRenew": true,
    "couponCode": null
}
```

### Expected Response
```json
{
    "membership": {
        "id": "membership-uuid-here",
        "userId": "user-123-uuid",
        "tierId": 1,
        "startDate": "2025-12-17T00:00:00.000Z",
        "endDate": "2026-12-17T00:00:00.000Z",
        "isActive": true,
        "autoRenew": true,
        "createdAt": "2025-12-17T...",
        "updatedAt": "2025-12-17T..."
    }
}
```

**Save the `membership.id` for later steps!**

---

## Step 3: Create Billing Invoice

Create an invoice for the membership subscription.

### Request
```
POST {{BASE_URL}}/billing/invoices
Content-Type: application/json
Authorization: Bearer {{JWT_TOKEN}}
```

### Body
```json
{
    "membershipId": "{{MEMBERSHIP_ID}}",
    "amount": 500,
    "currency": "SAR",
    "dueDate": "2025-12-24T00:00:00.000Z",
    "description": "Premium Membership - Monthly Subscription",
    "items": [
        {
            "description": "Premium Plan - Monthly",
            "quantity": 1,
            "unitPrice": 500,
            "total": 500
        }
    ]
}
```

### Expected Response
```json
{
    "invoice": {
        "id": "invoice-uuid-here",
        "membershipId": "membership-uuid-here",
        "invoiceNumber": "INV-2025-001",
        "amount": 500,
        "currency": "SAR",
        "dueDate": "2025-12-24T00:00:00.000Z",
        "status": "PENDING",
        "isOverdue": false,
        "daysUntilDue": 7,
        "createdAt": "2025-12-17T...",
        "updatedAt": "2025-12-17T..."
    }
}
```

**Save the `invoice.id` for payment processing!**

**A notification should be triggered for the user about the new invoice!**

---

## Step 4: Create Payment Transaction

Create a payment for the invoice.

### Request
```
POST {{BASE_URL}}/memberships/{{MEMBERSHIP_ID}}/payments
Content-Type: application/json
Authorization: Bearer {{JWT_TOKEN}}
```

### Body
```json
{
    "invoiceId": "{{INVOICE_ID}}",
    "provider": "stripe",
    "amount": 500,
    "currency": "SAR",
    "metadata": {
        "source": "web",
        "paymentMethod": "card"
    }
}
```

### Expected Response
```json
{
    "payment": {
        "id": "payment-uuid-here",
        "invoiceId": "invoice-uuid-here",
        "provider": "stripe",
        "providerTxnId": null,
        "amount": 500,
        "currency": "SAR",
        "status": "PENDING",
        "createdAt": "2025-12-17T...",
        "updatedAt": "2025-12-17T..."
    }
}
```

**Save the `payment.id` for completing the payment!**

---

## Step 5: Complete Payment (Webhook Simulation)

Simulate a payment webhook callback to complete the payment.

### Request
```
POST {{BASE_URL}}/memberships/payments/{{PAYMENT_ID}}/complete
Content-Type: application/json
Authorization: Bearer {{JWT_TOKEN}}
```

### Body
```json
{
    "providerTxnId": "stripe_txn_12345abcde"
}
```

### Expected Response
```json
{
    "payment": {
        "id": "payment-uuid-here",
        "invoiceId": "invoice-uuid-here",
        "provider": "stripe",
        "providerTxnId": "stripe_txn_12345abcde",
        "amount": 500,
        "currency": "SAR",
        "status": "COMPLETED",
        "createdAt": "2025-12-17T...",
        "updatedAt": "2025-12-17T..."
    }
}
```

---

## Step 6: Mark Invoice as Paid

After payment is complete, mark the invoice as paid.

### Request
```
PATCH {{BASE_URL}}/billing/invoices/{{INVOICE_ID}}/paid
Content-Type: application/json
Authorization: Bearer {{JWT_TOKEN}}
```

### Expected Response
```json
{
    "invoice": {
        "id": "invoice-uuid-here",
        "invoiceNumber": "INV-2025-001",
        "status": "PAID",
        ...
    }
}
```

**A notification should be triggered for the user about the successful payment!**

---

## Step 7: Check Quota (Before Consumption)

Check the user's current quota status.

### Request
```
GET {{BASE_URL}}/memberships/{{MEMBERSHIP_ID}}/quota/consultations
Authorization: Bearer {{JWT_TOKEN}}
```

### Expected Response
```json
{
    "quota": {
        "resource": "consultations",
        "limit": 10,
        "used": 0,
        "remaining": 10,
        "percentUsed": 0
    }
}
```

---

## Step 8: Consume Quota (Service Usage)

Simulate consumption of quota when user uses a service.

### Request
```
PUT {{BASE_URL}}/memberships/{{MEMBERSHIP_ID}}/quota/consultations/consume
Content-Type: application/json
Authorization: Bearer {{JWT_TOKEN}}
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

## Step 9: Check Quota (After Consumption)

Verify quota was consumed.

### Request
```
GET {{BASE_URL}}/memberships/{{MEMBERSHIP_ID}}/quota/consultations
Authorization: Bearer {{JWT_TOKEN}}
```

### Expected Response
```json
{
    "quota": {
        "resource": "consultations",
        "limit": 10,
        "used": 1,
        "remaining": 9,
        "percentUsed": 10
    }
}
```

---

## Step 10: Consume More Quota (Near Limit - Should Trigger Warning)

Consume more quota to approach the limit (e.g., 80% threshold).

### Request
```
PUT {{BASE_URL}}/memberships/{{MEMBERSHIP_ID}}/quota/consultations/consume
Content-Type: application/json
Authorization: Bearer {{JWT_TOKEN}}
```

### Body
```json
{
    "amount": 7
}
```

**When quota reaches 80% (8 out of 10), a QUOTA_WARNING notification should be triggered!**

---

## Step 11: Check Notifications for User

View all notifications triggered during the flow.

### Request
```
GET {{BASE_URL}}/notifications/user/{{USER_ID}}
Authorization: Bearer {{JWT_TOKEN}}
```

### Expected Response
```json
{
    "success": true,
    "data": [
        {
            "id": "notif-1",
            "userId": "user-123-uuid",
            "type": "INVOICE_CREATED",
            "title": "New Invoice",
            "titleAr": "فاتورة جديدة",
            "message": "Invoice #INV-2025-001 has been created for SAR 500.00...",
            "messageAr": "تم إنشاء الفاتورة #INV-2025-001...",
            "isRead": false,
            "createdAt": "2025-12-17T..."
        },
        {
            "id": "notif-2",
            "userId": "user-123-uuid",
            "type": "PAYMENT_RECEIVED",
            "title": "Payment Successful",
            "titleAr": "تم الدفع بنجاح",
            "message": "Your payment of SAR 500.00 has been processed...",
            "isRead": false,
            "createdAt": "2025-12-17T..."
        },
        {
            "id": "notif-3",
            "userId": "user-123-uuid",
            "type": "QUOTA_WARNING",
            "title": "Quota Warning",
            "titleAr": "تحذير الحصة",
            "message": "You have used 80% of your consultations quota...",
            "isRead": false,
            "createdAt": "2025-12-17T..."
        }
    ]
}
```

---

## Step 12: Get Unread Notification Count

### Request
```
GET {{BASE_URL}}/notifications/user/{{USER_ID}}/unread/count
Authorization: Bearer {{JWT_TOKEN}}
```

### Expected Response
```json
{
    "success": true,
    "data": {
        "unreadCount": 3
    }
}
```

---

## Step 13: Mark Notification as Read

### Request
```
PATCH {{BASE_URL}}/notifications/{{NOTIFICATION_ID}}/read
Authorization: Bearer {{JWT_TOKEN}}
```

### Expected Response
```json
{
    "success": true,
    "data": {
        "id": "notif-1",
        "isRead": true,
        "readAt": "2025-12-17T..."
    }
}
```

---

## Step 14: Check Membership Status

### Request
```
GET {{BASE_URL}}/memberships/{{MEMBERSHIP_ID}}/status
Authorization: Bearer {{JWT_TOKEN}}
```

### Expected Response
```json
{
    "status": {
        "isActive": true,
        "currentTier": "Premium Plan",
        "daysRemaining": 365,
        "willExpire": false,
        "isExpiring": false,
        "autoRenew": true,
        "quotaUsage": {
            "consultations": { "used": 8, "limit": 10, "remaining": 2 },
            "legalOpinions": { "used": 0, "limit": 5, "remaining": 5 }
        }
    }
}
```

---

## Additional Test Scenarios

### A. Test Role Assignment Notification

```
POST {{BASE_URL}}/admin/roles/users/{{USER_ID}}/assign
Content-Type: application/json
Authorization: Bearer {{JWT_TOKEN}}

{
    "roleName": "premium_member"
}
```

**This will trigger a ROLE_ASSIGNED notification to the user!**

---

### B. Test Consultation Assignment Notification

```
PUT {{BASE_URL}}/consultation-requests/{{CONSULTATION_ID}}/assign
Content-Type: application/json
Authorization: Bearer {{JWT_TOKEN}}

{
    "providerId": "provider-uuid"
}
```

**This will trigger notifications to both subscriber and provider!**

---

### C. Test Legal Opinion Completion Notification

```
POST {{BASE_URL}}/legal-opinion-requests/{{OPINION_ID}}/complete
Content-Type: application/json
Authorization: Bearer {{JWT_TOKEN}}
```

**This will trigger a LEGAL_OPINION_COMPLETED notification to the client!**

---

## Postman Collection Variables

Create these variables in your Postman collection:

| Variable | Example Value | Description |
|----------|--------------|-------------|
| `BASE_URL` | `http://localhost:3000` | Server base URL |
| `JWT_TOKEN` | `eyJhbGc...` | Valid JWT token |
| `USER_ID` | `user-123-uuid` | Test user ID |
| `MEMBERSHIP_ID` | `mem-456-uuid` | Created membership ID |
| `INVOICE_ID` | `inv-789-uuid` | Created invoice ID |
| `PAYMENT_ID` | `pay-012-uuid` | Created payment ID |
| `TIER_ID` | `1` | Created tier ID |
| `NOTIFICATION_ID` | `notif-345-uuid` | Notification ID |

---

## Environment Setup Script (Pre-request)

```javascript
// Pre-request script to set timestamp
pm.environment.set("timestamp", new Date().toISOString());

// Generate random UUID for testing
pm.environment.set("randomUUID", pm.variables.replaceIn("{{$randomUUID}}"));
```

---

## Test Script Examples

### Test for successful membership creation
```javascript
pm.test("Membership created successfully", function() {
    pm.response.to.have.status(201);
    var jsonData = pm.response.json();
    pm.expect(jsonData.membership).to.have.property('id');
    pm.expect(jsonData.membership.isActive).to.be.true;

    // Save membership ID for later tests
    pm.environment.set("MEMBERSHIP_ID", jsonData.membership.id);
});
```

### Test for notification creation
```javascript
pm.test("Notification exists for user", function() {
    pm.response.to.have.status(200);
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.expect(jsonData.data).to.be.an('array');
    pm.expect(jsonData.data.length).to.be.greaterThan(0);
});
```

### Test for quota consumption
```javascript
pm.test("Quota consumed successfully", function() {
    pm.response.to.have.status(200);
    var jsonData = pm.response.json();
    pm.expect(jsonData.message).to.include("Successfully consumed");
});
```

---

## Quick Test Sequence (Copy-Paste Ready)

```bash
# 1. Create Tier
curl -X POST http://localhost:3000/memberships/tiers \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Plan","nameAr":"خطة اختبار","price":100,"currency":"SAR","billingCycle":"monthly","quota":{"consultations":5},"benefits":["Test"],"isActive":true}'

# 2. Create Membership
curl -X POST http://localhost:3000/memberships \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-id","tierId":1,"durationInMonths":1,"autoRenew":false}'

# 3. Check Quota
curl http://localhost:3000/memberships/{MEMBERSHIP_ID}/quota/consultations

# 4. Consume Quota
curl -X PUT http://localhost:3000/memberships/{MEMBERSHIP_ID}/quota/consultations/consume \
  -H "Content-Type: application/json" \
  -d '{"amount":1}'

# 5. Check Notifications
curl http://localhost:3000/notifications/user/test-user-id
```

---

## Notification Types That Will Be Triggered

| Action | Notification Type | Recipients |
|--------|------------------|------------|
| Invoice Created | `INVOICE_CREATED` | User |
| Invoice Paid | `INVOICE_PAID` | User |
| Invoice Overdue | `INVOICE_OVERDUE` | User |
| Payment Success | `PAYMENT_RECEIVED` | User |
| Payment Failed | `PAYMENT_FAILED` | User |
| Quota at 80% | `QUOTA_WARNING` | User |
| Quota Exceeded | `QUOTA_EXCEEDED` | User |
| Role Assigned | `ROLE_ASSIGNED` | User |
| Role Removed | `ROLE_REMOVED` | User |
| Consultation Assigned | `CONSULTATION_ASSIGNED` | Subscriber |
| Consultation Assigned | `NEW_CONSULTATION_REQUEST` | Provider |
| Consultation Completed | `CONSULTATION_COMPLETED` | Subscriber |
| Legal Opinion Assigned | `LEGAL_OPINION_ASSIGNED` | Client |
| Legal Opinion Assigned | `NEW_LEGAL_OPINION_REQUEST` | Lawyer |
| Legal Opinion Completed | `LEGAL_OPINION_COMPLETED` | Client |
| Membership Expiring | `MEMBERSHIP_EXPIRING` | User |
| Membership Expired | `MEMBERSHIP_EXPIRED` | User |

---

## Troubleshooting

### No notifications showing?
1. Check if NotificationModule is imported in AppModule
2. Verify NotificationIntegrationService is injected in controllers
3. Check server logs for notification errors
4. Verify database connection for notification table

### 404 errors?
1. Ensure all modules are registered in `app.module.ts`
2. Check if routes are correctly prefixed
3. Verify JWT authentication is properly configured

### Quota not updating?
1. Check if membership is active
2. Verify tier has the correct quota limits
3. Ensure the resource type matches exactly (e.g., "consultations")

---

**Happy Testing!**
