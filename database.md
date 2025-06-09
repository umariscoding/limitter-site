# Database Schema Documentation

## Collections Overview

### 1. users
User profile and account information
```javascript
{
  id: "user_id", // Document ID
  profile_email: "user@example.com",
  profile_name: "User Name",
  plan: "free" | "pro" | "elite",
  isAdmin: false,
  sites_limit: 3 | -1, // 3 for free, unlimited for others
  plan_features: ["array", "of", "features"],
  monthly_overrides: 0 | 15 | -1, // Free: 0, Pro: 15, Elite: unlimited
  devices_limit: 1 | 3 | 10, // Free: 1, Pro: 3, Elite: 10
  created_at: timestamp,
  updated_at: timestamp,
  plan_benefits_granted_at: timestamp,
  last_plan_change: {
    from: "previous_plan",
    to: "new_plan", 
    changed_at: timestamp,
    benefits_granted: {...}
  }
}
```

### 2. subscriptions
User subscription details
```javascript
{
  id: "user_id", // Document ID
  user_id: "user_id",
  plan: "free" | "pro" | "elite",
  status: "active" | "cancelled" | "expired",
  created_at: timestamp,
  updated_at: timestamp,
  admin_change: {
    previous_plan: "plan",
    new_plan: "plan",
    reason: "Admin changed",
    changed_at: timestamp
  }
}
```

### 3. blocked_sites
User's blocked websites and applications
```javascript
{
  id: "site_id", // Document ID
  user_id: "user_id",
  name: "Site Name",
  url: "example.com",
  override_active: true | false,
  override_initiated_by: "device_id",
  override_initiated_at: timestamp,
  is_active: true | false,
  lockout_duration: 3600, // seconds (1 hour for free, custom for others)
  lockout_end_time: timestamp | null,
  created_at: timestamp,
  updated_at: timestamp,
  soft_deleted_at: timestamp | null,
  analytics: {
    total_time_saved_minutes: 0,
    overrides_used: 0,
    last_override: timestamp
  }
}
```

### 4. user_overrides
User override credits and usage tracking
```javascript
{
  id: "user_id", // Document ID
  user_id: "user_id",
  overrides_left: 15, // Current balance
  monthly_limit: 0 | 15 | -1, // Plan limits
  total_overrides_received: 15,
  total_overrides_used: 0,
  current_plan: "plan",
  plan_activated_at: timestamp,
  created_at: timestamp,
  last_admin_grant: {
    quantity: 15,
    reason: "Pro plan activation",
    granted_at: timestamp,
    granted_by: "admin_id"
  },
  monthly_stats: {
    "2024-01": {
      overrides_used: 5,
      overrides_received: 15,
      month_start: timestamp
    }
  }
}
```

### 5. admin_audit
Admin action logging for compliance
```javascript
{
  id: "audit_id", // Auto-generated
  action: "GRANT_OVERRIDES" | "CHANGE_PLAN" | "DELETE_SITE" | "GRANT_PLAN_BENEFITS",
  admin_id: "admin_user_id",
  target_user_id: "target_user_id",
  details: {
    // Action-specific details
    previous_plan: "free",
    new_plan: "pro", 
    overrides_granted: 15,
    reason: "Admin panel plan change"
  },
  timestamp: timestamp
}
```

### 6. admin_audit_log  
Detailed audit trail for hard deletions
```javascript
{
  id: "log_id", // Auto-generated
  action: "hard_delete_site" | "delete_document",
  site_id: "site_id",
  document_id: "doc_id",
  collection: "collection_name",
  site_data: {...}, // Original data before deletion
  document_data: {...},
  reason: "Admin hard deleted",
  deleted_at: timestamp
}
```

### 7. user_activity
User activity tracking for analytics dashboard
```javascript
{
  id: "activity_id", // Auto-generated
  user_id: "user_id",
  type: "admin_plan_change" | "admin_override_grant" | "site_added" | "override_used",
  description: "Plan upgraded to Pro by admin (15 free overrides/month)",
  icon: "💎",
  color: "purple",
  created_at: timestamp,
  data: {
    // Activity-specific data
    previousPlan: "free",
    newPlan: "pro",
    upgradedBy: "admin",
    overrides_granted: 15
  }
}
```

## Security Rules

### Read Access
- Users can read their own data only
- Admins can read all data
- Public read access: none

### Write Access  
- Users can write to their own profile and sites
- Users cannot modify plan, overrides, or admin fields
- Admins can modify all fields
- Override grants only through admin functions

## Indexes Required

### Composite Indexes
```javascript
// blocked_sites
user_id (Ascending) + created_at (Descending)
user_id (Ascending) + is_active (Ascending)

// admin_audit
admin_id (Ascending) + timestamp (Descending)
target_user_id (Ascending) + timestamp (Descending)

// user_activity
user_id (Ascending) + created_at (Descending)
user_id (Ascending) + type (Ascending) + created_at (Descending)
```

### Single Field Indexes
```javascript
// users
plan, isAdmin, created_at

// subscriptions  
plan, status, created_at

// blocked_sites
user_id, is_active, created_at

// user_overrides
user_id, current_plan

// user_activity
user_id, type, created_at
```

## Data Relationships

```
users (1) ←→ (1) subscriptions
users (1) ←→ (many) blocked_sites  
users (1) ←→ (1) user_overrides
users (1) ←→ (many) user_activity
users (many) ←→ (many) admin_audit [admin_id, target_user_id]
```

## Backup Strategy

- Daily automated backups
- 30-day retention policy
- Admin audit logs: permanent retention
- User data: follows data retention policy

## Performance Considerations

- Use pagination for large datasets
- Implement caching for frequently accessed data
- Monitor read/write costs
- Optimize queries with proper indexing 