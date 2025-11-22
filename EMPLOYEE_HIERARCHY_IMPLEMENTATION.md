# Employee Hierarchy Implementation Plan

## Overview
Implement a comprehensive hierarchical employee management system with role-based dashboards and secure admin access.

## Hierarchy Structure

```
COMPANY (ADMIN)
├── MANAGER
│   └── STATE_MANAGER
│       └── DISTRICT_MANAGER
│           ├── SUPERVISOR
│           │   ├── EMPLOYEE (Fixed Salary / Commission-based)
│           │   └── RETAILER
│           └── DISTRIBUTOR
│               ├── EMPLOYEE (Commission-based only)
│               └── RETAILER
```

## Database Structure (Already Exists)

### users table
- `designation`: VARCHAR - STATE_MANAGER, DISTRICT_MANAGER, SUPERVISOR, EMPLOYEE, RETAILER, DISTRIBUTOR, MANAGER
- `parent_employee_id`: UUID - Reference to parent employee
- `territory_state`: VARCHAR - For state managers
- `territory_district`: VARCHAR - For district managers
- `territory_area`: VARCHAR - For supervisors

### employee_hierarchy table
- `employee_id`: UUID (unique)
- `parent_id`: UUID
- `designation`: VARCHAR
- `level`: INTEGER
- `path`: TEXT (materialized path)
- `territory_state`, `territory_district`, `territory_area`

## Implementation Tasks

### 1. Update Types & Enums
- [x] Add EmployeeDesignation enum
- [x] Add CompensationType enum
- [x] Update User type with hierarchy fields

### 2. Secure Admin Login
- [x] Remove admin dropdown from login page
- [x] Add separate secure admin login link
- [x] Create dedicated admin login page at `/admin/login`

### 3. Dashboard Views by Designation

#### ADMIN/COMPANY Dashboard
- Full system access
- View all employees, retailers, customers
- Registration management for all levels
- Complete transaction visibility
- ID mapping system
- Printable registration pages
- Document management
- Salary/payment records with dates and status

#### MANAGER Dashboard
- View all State Managers
- Register State Managers
- View all company transactions
- State-wise business totals
- Performance analytics

#### STATE_MANAGER Dashboard
- View all District Managers in state
- Register District Managers
- District-wise business records
- State services and products management
- Territory: State level

#### DISTRICT_MANAGER Dashboard
- Oversee district operations
- Register Supervisors and Distributors
- District performance metrics
- Territory: District level

#### SUPERVISOR Dashboard
- Register Employees and Retailers
- Connect Employees with Retailers
- Oversee product delivery
- Territory: Area level

#### EMPLOYEE Dashboard (Current - No Changes)
- Handle application forms
- Connect with Retailers
- Register Retailers
- Product-related work
- Commission tracking (if commission-based)

#### DISTRIBUTOR Dashboard
- Commission-based work
- Register own employees
- Product Purchase and Sale access
- No Application Forms or Free Services

#### RETAILER Dashboard (Current - No Changes)
- Provide government services
- Earn commissions
- Customer management

### 4. Registration Flow Updates
- [x] Add designation selection in employee creation
- [x] Implement parent-child relationship
- [x] Territory assignment based on designation
- [x] Compensation type selection (Fixed/Commission)
- [x] Auto-populate employee_hierarchy table

### 5. Access Control
- [x] Middleware updates for designation-based access
- [x] API route protection by designation
- [x] Dashboard component visibility rules

## Security Enhancements

1. **Admin Login**
   - Separate URL: `/admin/login`
   - No public dropdown
   - Enhanced security measures
   - Rate limiting

2. **Hierarchy Validation**
   - Parent must be active
   - Parent designation must be one level above
   - Territory inheritance validation

3. **Data Access**
   - Users can only see their subordinates
   - Territory-based filtering
   - Role-based data visibility

## UI/UX Changes

### Login Page
- Remove admin option from role dropdown
- Add subtle admin login link in footer
- Keep Customer, Employee, Retailer options

### Dashboard Navigation
- Dynamic menu based on designation
- Hierarchical breadcrumbs
- Territory indicator

### Employee Management
- Visual hierarchy tree
- Drag-and-drop reassignment
- Bulk operations support

## API Endpoints to Create/Update

1. `/api/employees/hierarchy` - GET hierarchy tree
2. `/api/employees/subordinates` - GET direct reports
3. `/api/employees/territory` - GET territory-based employees
4. `/api/dashboard/stats/[designation]` - Designation-specific stats
5. `/api/admin/secure-login` - Admin authentication

## Testing Checklist

- [ ] Admin can access all features
- [ ] Manager can register State Managers
- [ ] State Manager can register District Managers
- [ ] District Manager can register Supervisors and Distributors
- [ ] Supervisor can register Employees and Retailers
- [ ] Distributor can register own Employees
- [ ] Employee can register Retailers
- [ ] Hierarchy tree displays correctly
- [ ] Territory filtering works
- [ ] Dashboard stats are accurate per role
- [ ] Access control prevents unauthorized access

## Migration Notes

**IMPORTANT**: This is a LIVE PRODUCTION database
- Only CREATE and READ operations allowed via MCP
- No UPDATE or DELETE operations
- Existing employees will need designation assignment manually
- New registrations will auto-populate hierarchy

## Next Steps

1. Update TypeScript types
2. Create admin login page
3. Update main login page
4. Create designation-specific dashboard components
5. Implement hierarchy management UI
6. Add API endpoints
7. Update middleware
8. Test thoroughly in development
9. Document for production deployment
