# Quick Employee Hierarchy Reference Guide

## 🎯 Hierarchy Structure

```
COMPANY (ADMIN) - Full system access
    ↓
MANAGER - Manages state managers, views all company data
    ↓
STATE_MANAGER - Manages district managers in their state
    ↓
DISTRICT_MANAGER - Manages supervisors and distributors in their district
    ↓
├── SUPERVISOR - Manages employees and retailers in their area
│   ↓
│   ├── EMPLOYEE (Fixed Salary or Commission) - Handles applications, connects retailers
│   │   ↓
│   │   └── RETAILER - Provides services to customers
│   │
│   └── RETAILER - Can self-register or be registered by employee
│
└── DISTRIBUTOR (Commission-based) - Product sales only
    ↓
    └── EMPLOYEE (Commission-based only) - Works under distributor
        ↓
        └── RETAILER - Provides services to customers
```

## 🔐 Login Access

### Regular Users
**URL**: `/login`
**Options**:
- Customer
- Retailer  
- Employee

### Admin Access
**URL**: `/admin/login`
**Access**: Secure, separate portal
**Link**: Small "Admin Access" link in footer of main login page

## 📊 Dashboard Views by Designation

### ADMIN (Company)
- Full system overview
- All employees, retailers, customers
- Complete transaction history
- System health monitoring
- Registration management for all levels

### MANAGER
- State managers overview
- Company-wide transactions
- State-wise business totals
- Revenue analytics
- Register state managers

### STATE_MANAGER
- District managers in state
- District-wise business records
- State services management
- State revenue tracking
- Register district managers

### DISTRICT_MANAGER
- Supervisors and distributors overview
- District operations metrics
- Performance scoring
- Register supervisors and distributors

### SUPERVISOR
- Employees and retailers management
- Area revenue tracking
- Product delivery oversight
- Register employees and retailers
- Connect employees with retailers

### DISTRIBUTOR
- Own employees management
- Product sales tracking
- Commission earnings
- Register own employees
- **NO ACCESS**: Application forms, Free services

### EMPLOYEE (Regular)
- Application processing
- Retailer connections
- Register retailers
- Commission tracking (if commission-based)

### RETAILER
- Service provision
- Customer management
- Commission earnings
- Application submissions

## 🎨 Dashboard Color Schemes

- **Admin**: Red gradient
- **Manager**: Purple gradient
- **State Manager**: Blue gradient
- **District Manager**: Indigo gradient
- **Supervisor**: Teal gradient
- **Distributor**: Amber gradient
- **Employee**: Default (current)
- **Retailer**: Default (current)

## 🔑 Key Features by Level

### Who Can Register Whom?

| Designation | Can Register |
|------------|--------------|
| ADMIN | Everyone |
| MANAGER | STATE_MANAGER |
| STATE_MANAGER | DISTRICT_MANAGER |
| DISTRICT_MANAGER | SUPERVISOR, DISTRIBUTOR |
| SUPERVISOR | EMPLOYEE, RETAILER |
| DISTRIBUTOR | EMPLOYEE (own only) |
| EMPLOYEE | RETAILER |
| RETAILER | - (can self-register) |

### Territory Assignment

| Designation | Territory Field |
|------------|----------------|
| STATE_MANAGER | territory_state |
| DISTRICT_MANAGER | territory_district |
| SUPERVISOR | territory_area |
| Others | Inherited from parent |

### Compensation Types

| Designation | Compensation Options |
|------------|---------------------|
| MANAGER | Fixed Salary |
| STATE_MANAGER | Fixed Salary |
| DISTRICT_MANAGER | Fixed Salary |
| SUPERVISOR | Fixed Salary |
| EMPLOYEE | Fixed Salary OR Commission |
| DISTRIBUTOR | Commission Only |
| RETAILER | Commission Only |

## 🚀 Quick Start for Developers

### 1. Test Admin Login
```
URL: http://localhost:3000/admin/login
Email: admin@example.com
Password: [admin password]
```

### 2. Test Regular Login
```
URL: http://localhost:3000/login
Select: Customer/Retailer/Employee
```

### 3. Check Dashboard Routing
- Login as employee with designation
- Dashboard should auto-route to designation-specific view
- Fallback to default dashboard if no designation

### 4. Database Queries to Test

```sql
-- Check existing employees
SELECT id, email, name, role, designation, parent_employee_id 
FROM users 
WHERE role = 'EMPLOYEE';

-- Check hierarchy
SELECT * FROM employee_hierarchy;

-- Check territory assignments
SELECT id, name, designation, territory_state, territory_district, territory_area
FROM users
WHERE designation IS NOT NULL;
```

## 📝 Implementation Checklist

### ✅ Completed (Phase 1)
- [x] Type system with designations
- [x] Secure admin login page
- [x] Updated main login page
- [x] Manager dashboard component
- [x] State Manager dashboard component
- [x] District Manager dashboard component
- [x] Supervisor dashboard component
- [x] Distributor dashboard component
- [x] Dashboard routing logic

### 🔄 In Progress (Phase 2)
- [ ] Update auth.ts with designation
- [ ] Create dashboard stats API
- [ ] Update employee creation API
- [ ] Add hierarchy validation
- [ ] Create territory assignment logic

### ⏳ Pending (Phase 3)
- [ ] Employee registration form with designation
- [ ] Hierarchy visualization UI
- [ ] Territory management UI
- [ ] Access control middleware
- [ ] Navigation updates

## 🐛 Troubleshooting

### Dashboard Not Showing Designation View
**Check**:
1. User has `designation` field set in database
2. User role is 'EMPLOYEE'
3. Session includes designation field
4. Dashboard component exists for that designation

### Admin Login Not Working
**Check**:
1. URL is `/admin/login` not `/login`
2. User role in database is 'ADMIN'
3. Credentials are correct
4. reCAPTCHA is configured

### Hierarchy Not Displaying
**Check**:
1. `parent_employee_id` is set correctly
2. `employee_hierarchy` table is populated
3. Designation values match enum
4. Territory fields are assigned

## 📞 Support

For issues or questions:
1. Check `HIERARCHY_IMPLEMENTATION_COMPLETE.md` for detailed info
2. Review `EMPLOYEE_HIERARCHY_IMPLEMENTATION.md` for full plan
3. Check database structure matches expected schema
4. Verify all environment variables are set

## 🎓 Training Notes

### For Admins
- Use `/admin/login` for secure access
- Can register and manage all hierarchy levels
- Full visibility into all operations
- Responsible for initial hierarchy setup

### For Managers
- Oversee state-level operations
- Register and manage state managers
- Monitor company-wide performance
- Access to all transaction data

### For State Managers
- Focus on district-level management
- Register district managers
- Track state performance
- Manage state services

### For District Managers
- Oversee district operations
- Register supervisors and distributors
- Monitor district performance
- Balance supervisor and distributor activities

### For Supervisors
- Ground-level management
- Register employees and retailers
- Connect employees with retailers
- Ensure product delivery

### For Distributors
- Commission-based product sales
- Register own employees
- Focus on product distribution
- No application form access

## 🔄 Data Flow

```
Customer → Retailer → Employee → Supervisor → District Manager → State Manager → Manager → Admin
                                                                                              ↓
                                                                                    Company Database
```

## 💾 Database Fields Reference

### users table (hierarchy fields)
```typescript
designation?: 'MANAGER' | 'STATE_MANAGER' | 'DISTRICT_MANAGER' | 'SUPERVISOR' | 'EMPLOYEE' | 'DISTRIBUTOR' | 'RETAILER'
parent_employee_id?: UUID
territory_state?: string
territory_district?: string
territory_area?: string
compensation_type?: 'FIXED_SALARY' | 'COMMISSION_BASED'
```

### employee_hierarchy table
```typescript
employee_id: UUID (unique)
parent_id: UUID
designation: string
level: number
path: string (e.g., "/manager_id/state_manager_id/district_manager_id")
territory_state?: string
territory_district?: string
territory_area?: string
is_active: boolean
```

---

**Last Updated**: Implementation Phase 1 Complete
**Status**: Ready for Phase 2 (Backend Integration)
**Version**: 1.0
