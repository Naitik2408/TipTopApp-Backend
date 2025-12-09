# Order Status Flow Strategy

## Overview
This document defines the complete order status workflow for all user roles (Customer, Admin, Delivery Partner) in the TipTop Restaurant application.

---

## User Roles
- **Customer**: Places orders and tracks delivery
- **Admin**: Manages orders, assigns delivery partners
- **Delivery Partner**: Picks up and delivers orders

---

## Order Status Enumeration

### Backend Order Statuses (Database)
```javascript
enum OrderStatus {
  PENDING           // Order placed and auto-confirmed, being prepared
  READY             // Food ready, awaiting delivery partner assignment/pickup
  OUT_FOR_DELIVERY  // Delivery partner picked up, on the way
  DELIVERED         // Successfully delivered to customer
  CANCELLED         // Order cancelled by customer/admin
}
```

**Note:** CONFIRMED and PREPARING statuses removed for simplicity. All orders are auto-confirmed on placement.

---

## Status Flow by Role

### 1. CUSTOMER VIEW
Customer sees simplified, customer-friendly status messages.

#### Status Progression:
```
ORDER PLACED (PENDING) - Auto-confirmed
    ↓
READY FOR PICKUP (READY) - Admin marks ready
    ↓
ON THE WAY (OUT_FOR_DELIVERY) - Partner picked up
    ↓
DELIVERED (DELIVERED) - Partner delivered
```

#### Status Mapping:
| Backend Status      | Customer View       | Icon               | Description                                    |
|---------------------|---------------------|--------------------|------------------------------------------------|
| PENDING             | Order Confirmed     | ✓ checkmark-circle | Your order is confirmed and being prepared     |
| READY               | Ready for Pickup    | ✓ checkmark        | Food is ready, waiting for delivery partner    |
| OUT_FOR_DELIVERY    | On the Way          | 🚗 car             | Delivery partner is on the way to you          |
| DELIVERED           | Delivered           | ✓✓ checkmark-done  | Order delivered successfully                   |
| CANCELLED           | Cancelled           | ✗ close-circle     | Order was cancelled                            |

#### Customer Actions:
- **PENDING**: Can cancel order
- **READY/OUT_FOR_DELIVERY**: Cannot cancel (contact support)
- **DELIVERED**: Can rate and review
- **Any status**: Can contact support

---

### 2. ADMIN VIEW
Admin sees detailed status for order management.

#### Status Progression:
```
NEW ORDER (PENDING) - Auto-confirmed on placement
    ↓
MARK READY (Set to READY) - Admin action when food is ready
    ↓
ASSIGN DELIVERY PARTNER (Status remains READY)
    ↓
PARTNER PICKS UP (Set to OUT_FOR_DELIVERY - by partner)
    ↓
PARTNER DELIVERS (Set to DELIVERED - by partner)
```

#### Admin Actions by Status:
| Status              | Available Actions                                                  |
|---------------------|--------------------------------------------------------------------|
| PENDING             | ✓ Mark Ready<br>✓ Cancel Order<br>✓ View Details                 |
| READY               | ✓ Assign Delivery Partner<br>✓ Reassign Partner<br>✓ Cancel      |
| OUT_FOR_DELIVERY    | ✓ View Live Tracking<br>✓ Contact Delivery Partner               |
| DELIVERED           | ✓ View Details<br>✓ Process Refund (if needed)                   |
| CANCELLED           | ✓ View Cancellation Details<br>✓ Process Refund                  |

#### Admin Notifications:
- 🔔 **New order** (PENDING) - Sound alert + Desktop notification + Email
- 🔔 **Order ready** (READY) - Reminder to assign delivery partner
- 🔔 **Payment collected** (COD) - Cash collection confirmation
- 🔔 **Order cancelled** - By customer

---

### 3. DELIVERY PARTNER VIEW
Delivery partner sees only orders assigned to them.

#### Status Progression:
```
ASSIGNED (READY)
    ↓
PICKED UP (Set to OUT_FOR_DELIVERY)
    ↓
DELIVERED (Set to DELIVERED + Collect COD if applicable)
```

#### Delivery Partner Statuses:
| Order Status        | Partner View        | Actions Available                               |
|---------------------|---------------------|-------------------------------------------------|
| READY (assigned)    | Ready for Pickup    | ✓ View Order Details<br>✓ Navigate to Restaurant<br>✓ Mark Picked Up<br>✓ Call Admin |
| OUT_FOR_DELIVERY    | On Delivery         | ✓ Navigate to Customer<br>✓ Mark Delivered<br>✓ Call Customer<br>✓ Report Issue |
| DELIVERED           | Completed           | ✓ View History<br>✓ Collect COD (if pending)   |

#### Delivery Partner Notifications:
- 🔔 **Order assigned** (READY) - New delivery job available
- 🔔 **Customer called** - Customer trying to contact
- 🔔 **Order cancelled** - Admin cancelled assigned order

---

## Status Transition Rules

### 1. Automatic Transitions
```javascript
// Order placed - auto confirmed
Order Created → PENDING (automatic on order placement)
```

### 2. Manual Transitions (Require Action)
```javascript
PENDING → READY (admin marks ready)
READY → OUT_FOR_DELIVERY (delivery partner picks up)
OUT_FOR_DELIVERY → DELIVERED (delivery partner delivers)
```

### 3. Cancellation Rules
```javascript
// Customer can cancel
PENDING → CANCELLED (customer action, only before READY)

// Admin can cancel
ANY_STATUS → CANCELLED (admin action with reason)

// Auto-cancel after timeout (optional for future)
PENDING (30 minutes no action) → CANCELLED (auto)
```

---

## Status Update Permissions

| Status              | Who Can Update                                    |
|---------------------|---------------------------------------------------|
| PENDING → READY     | Admin only                                        |
| READY → OUT_FOR_DELIVERY | Delivery Partner only (after assigned)      |
| OUT_FOR_DELIVERY → DELIVERED | Delivery Partner only                    |
| ANY → CANCELLED     | Admin (any time), Customer (only PENDING)         |

---

## Real-time Updates (Socket.io Events)

### Customer Socket Events:
```javascript
// Listen
'order:status-updated'    // Order status changed
'order:assigned'          // Delivery partner assigned (with partner info)
'order:picked-up'         // Partner picked up order
'order:location-update'   // Partner location update (while OUT_FOR_DELIVERY)
'order:delivered'         // Order delivered

// Emit
'order:cancel'            // Request cancellation
'order:track'             // Request current status
```

### Admin Socket Events:
```javascript
// Listen
'order:new'               // New order placed (PENDING)
'order:cancelled'         // Customer cancelled
'partner:location'        // Delivery partner location updates

// Emit
'order:ready'             // Mark order ready (PENDING → READY)
'order:assign-partner'    // Assign delivery partner
'order:cancel'            // Cancel order
```

### Delivery Partner Socket Events:
```javascript
// Listen
'order:assigned'          // New order assigned
'order:cancelled'         // Order cancelled by admin/customer

// Emit
'order:picked-up'         // Mark order picked up
'order:delivered'         // Mark order delivered
'location:update'         // Send location updates
'order:issue'             // Report delivery issue
```

---

## StatusHistory Tracking

Every status change is recorded in `statusHistory` array:

```javascript
{
  status: 'CONFIRMED',
  timestamp: new Date(),
  updatedBy: adminUserId,      // User who made the change
  notes: 'Order confirmed by admin',
  location: {
    type: 'Point',
    coordinates: [lng, lat]     // Optional: GPS location
  }
}
```

### StatusHistory Use Cases:
1. **Order timeline** - Show customer when each status occurred
2. **Dispute resolution** - Track who changed what and when
3. **Performance metrics** - Calculate preparation time, delivery time
4. **Delivery tracking** - Plot delivery partner route

---

## Time Estimations

### Estimated Times:
```javascript
// Set when order is confirmed
estimatedPrepTime: 20 minutes      // Kitchen preparation
estimatedDeliveryTime: 35 minutes  // Total time from order to delivery

// Updated when partner assigned
estimatedDeliveryTime: recalculated based on distance

// Set when delivered
actualDeliveryTime: actual timestamp
```

### Time-based Alerts:
- ⚠️ Order taking longer than estimated (notify admin)
- ⚠️ Partner not picked up within 5 min of READY (notify admin)
- ⚠️ Delivery delayed beyond estimate (notify customer)

---

## COD (Cash on Delivery) Workflow

### When OUT_FOR_DELIVERY:
```javascript
cashCollection: {
  expectedAmount: 890,          // Final order amount
  collectedAmount: 0,           // Set by partner on delivery
  changeFund: 0,                // If customer gave more
  collectedAt: null,            // Timestamp when collected
  isSettled: false              // Partner settled with admin
}
```

### When DELIVERED with COD:
1. Delivery partner marks delivered
2. Partner enters `collectedAmount` (what customer paid)
3. Partner enters `changeFund` (change given)
4. `collectedAt` = current timestamp
5. Admin reviews and marks `isSettled = true` when partner hands over cash

---

## Mobile App Status Display

### Customer App - Order Card:
```typescript
interface OrderCardDisplay {
  orderNumber: string
  status: 'Order Placed' | 'Confirmed' | 'Preparing' | 'On the Way' | 'Delivered'
  statusColor: string         // '#FF9800' | '#2196F3' | '#e36057' | '#9C27B0' | '#4CAF50'
  statusIcon: string          // Ionicons name
  estimatedTime: string       // "Arriving in 25 min"
  deliveryPartner?: {         // Shown only when OUT_FOR_DELIVERY
    name: string
    phone: string
    vehicle: string
  }
  canCancel: boolean          // true for PENDING/CONFIRMED/PREPARING
  canTrack: boolean           // true for OUT_FOR_DELIVERY
  canRate: boolean            // true for DELIVERED
}
```

### Admin Panel - Order Status Badge:
```typescript
interface AdminOrderBadge {
  status: OrderStatus         // Full backend status
  urgency: 'normal' | 'attention' | 'urgent'
  timeInStatus: number        // Minutes in current status
  hasIssues: boolean         // Delayed, customer complained, etc.
  nextAction: string         // "Confirm Order" | "Assign Partner" | etc.
}
```

### Delivery Partner App - Order Card:
```typescript
interface DeliveryOrderCard {
  orderNumber: string
  status: 'Ready for Pickup' | 'On Delivery' | 'Completed'
  restaurant: {
    name: string
    address: string
    distance: string          // "1.2 km away"
  }
  customer: {
    name: string
    address: string
    phone: string
    distance: string          // "2.5 km away"
  }
  paymentMethod: 'COD' | 'ONLINE'
  codAmount?: number          // If COD
  estimatedEarning: number    // Delivery fee
  canPickup: boolean          // true for READY
  canDeliver: boolean         // true for OUT_FOR_DELIVERY
}
```

---

## API Endpoints

### Customer APIs:
```javascript
GET    /api/orders/my-orders           // Get customer's orders
GET    /api/orders/:id                 // Get order details
PATCH  /api/orders/:id/cancel          // Cancel order (if allowed)
POST   /api/orders/:id/rate            // Rate completed order
GET    /api/orders/:id/track           // Get real-time tracking (if OUT_FOR_DELIVERY)
```

### Admin APIs:
```javascript
GET    /api/admin/orders                // Get all orders (with filters)
PATCH  /api/admin/orders/:id/ready      // Mark ready (PENDING → READY)
PATCH  /api/admin/orders/:id/assign     // Assign delivery partner
PATCH  /api/admin/orders/:id/cancel     // Cancel order
GET    /api/admin/orders/stats          // Order statistics
```

### Delivery Partner APIs:
```javascript
GET    /api/delivery/orders/available   // Get unassigned orders (not implemented)
GET    /api/delivery/orders/assigned    // Get assigned orders
PATCH  /api/delivery/orders/:id/pickup  // Mark picked up
PATCH  /api/delivery/orders/:id/deliver // Mark delivered
POST   /api/delivery/orders/:id/collect-cash // Record COD collection
POST   /api/delivery/location           // Update location
```

---

## Implementation Priority

### Phase 1 (Current - Basic Flow):
- ✅ Order creation (PENDING)
- ✅ Basic status enum
- ✅ Customer view of orders
- ✅ StatusHistory tracking

### Phase 2 (Next - Admin Controls):
- ⏳ Admin mark ready (PENDING → READY)
- ⏳ Admin assign delivery partner
- ⏳ Admin cancel order

### Phase 3 (Delivery Partner):
- ⏳ Delivery partner view assigned orders
- ⏳ Mark picked up (READY → OUT_FOR_DELIVERY)
- ⏳ Mark delivered (OUT_FOR_DELIVERY → DELIVERED)
- ⏳ COD collection

### Phase 4 (Real-time & Advanced):
- ⏳ Socket.io real-time updates
- ⏳ Live location tracking
- ⏳ Push notifications
- ⏳ SMS notifications
- ⏳ Auto-cancel timeout
- ⏳ Order rating system

---

## Summary

### Customer Flow:
**Place Order** → See "Order Confirmed" (PENDING) → See "On the Way" (OUT_FOR_DELIVERY with partner info) → See "Delivered" → Rate Order

### Admin Flow:
**New Order Alert** (PENDING) → Mark Ready → Assign Partner → Monitor Delivery → Order Complete

### Delivery Partner Flow:
**Order Assigned** (READY) → Navigate to Restaurant → Pick Up (OUT_FOR_DELIVERY) → Navigate to Customer → Deliver → Collect COD (if applicable) → Complete

---

**Document Version:** 1.0  
**Last Updated:** December 8, 2025  
**Status:** Strategy Approved - Ready for Implementation
