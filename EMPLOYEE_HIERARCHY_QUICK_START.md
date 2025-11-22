# Employee Hierarchy System - Quick Start Guide

## 🚀 Getting Started

### Step 1: Login as Admin
```
Email: premsargar2004@gmail.com (or your admin account)
```

### Step 2: Access Employee Management
1. Look for **"Employee Management"** 🧑‍💼 in the sidebar
2. Click to open the employee management page

### Step 3: Create Your First Manager
1. Click **"+ Create Employee"** button
2. Fill in the form:
   - **Name**: John Manager
   - **Email**: john.manager@example.com
   - **Password**: SecurePass123
   - **Phone**: 9876543210
   - **Designation**: Select "MANAGER"
   - **Territory State**: Maharashtra (optional)
   - **Employee ID**: MGR001 (optional)
   - **Department**: Operations (optional)
3. Click **"Create Employee"**
4. ✅ Success! Manager created

### Step 4: View Organization Hierarchy
1. Click **"Organization Hierarchy"** 🏢 in the sidebar
2. You'll see:
   - Your position at the top (Admin)
   - Your newly created manager below
   - Statistics showing team size

### Step 5: Login as Manager (Test Hierarchy)
1. Logout from Admin
2. Login with manager credentials:
   ```
   Email: john.manager@example.com
   Password: SecurePass123
   ```
3. Notice:
   - Dashboard shows "MANAGER" designation
   - Can see "Employee Management" menu
   - Can see "Organization Hierarchy" menu

### Step 6: Create State Manager (as Manager)
1. Click **"Employee Management"**
2. Click **"+ Create Employee"**
3. Notice: Designation dropdown only shows:
   - State Manager
   - District Manager
   - Supervisor
   - Distributor
   - Employee
   - Retailer
   - ❌ Cannot create another Manager (hierarchy enforced!)
4. Create a State Manager:
   - **Name**: Sarah State
   - **Email**: sarah.state@example.com
   - **Password**: SecurePass123
   - **Designation**: STATE_MANAGER
   - **Territory State**: Maharashtra
5. Click **"Create Employee"**

### Step 7: View Your Team Hierarchy
1. Click **"Organization Hierarchy"**
2. You'll see:
   - You (Manager) at the top
   - Sarah State (State Manager) below you
   - Click on Sarah to expand (when she has team members)

## 📊 Hierarchy Structure

```
ADMIN (You)
└── MANAGER (John)
    └── STATE_MANAGER (Sarah)
        └── DISTRICT_MANAGER
            └── SUPERVISOR
                └── EMPLOYEE
                    └── RETAILER
```

## 🎯 Key Features

### 1. **Designation-Based Access**
- Each level can only create employees below them
- Automatic hierarchy validation
- Cannot create peers or superiors

### 2. **Visual Hierarchy Tree**
- Expandable/collapsible branches
- Color-coded designations
- Team member counts
- Territory information

### 3. **Employee Management**
- Create employees with full details
- View all your direct reports
- Track employee information
- Territory assignments

### 4. **Dashboard Integration**
- Shows your designation prominently
- Territory display
- Role-specific welcome messages

## 🔐 Access Control Matrix

| Designation | Can Create | Can See Hierarchy | Can See Emp Mgmt |
|------------|-----------|------------------|------------------|
| ADMIN | All | ✅ Yes | ✅ Yes |
| MANAGER | State Mgr & below | ✅ Yes | ✅ Yes |
| STATE_MANAGER | District Mgr & below | ✅ Yes | ✅ Yes |
| DISTRICT_MANAGER | Supervisor & below | ✅ Yes | ✅ Yes |
| SUPERVISOR | Employee & Retailer | ✅ Yes | ✅ Yes |
| DISTRIBUTOR | Employee & Retailer | ✅ Yes | ✅ Yes |
| EMPLOYEE | Retailer only | ✅ Yes | ✅ Yes |
| RETAILER | None | ❌ No | ❌ No |

## 🎨 Designation Colors

- 👔 **MANAGER** - Purple
- 🏛️ **STATE_MANAGER** - Blue  
- 🏢 **DISTRICT_MANAGER** - Green
- 👨‍💼 **SUPERVISOR** - Yellow
- 📦 **DISTRIBUTOR** - Orange
- 👤 **EMPLOYEE** - Gray
- 🏪 **RETAILER** - Red

## 📝 Common Tasks

### Create a Complete Team Structure
```
1. Admin creates Manager
2. Manager creates State Manager
3. State Manager creates District Manager
4. District Manager creates Supervisor
5. Supervisor creates Employees
6. Employees create Retailers
```

### View Team Performance
1. Go to Organization Hierarchy
2. See total team members
3. Expand branches to see sub-teams
4. Check territory assignments

### Assign Territories
When creating employees, fill in:
- **Territory State**: Maharashtra, Gujarat, etc.
- **Territory District**: Mumbai, Pune, etc.
- **Territory Area**: Andheri, Koregaon Park, etc.

## 🐛 Troubleshooting

### "Cannot see Employee Management menu"
- ✅ Check: Are you logged in as Admin or Employee with designation?
- ✅ Check: Regular employees without designation cannot see this menu
- ✅ Check: Retailers cannot see this menu

### "Cannot create Manager designation"
- ✅ This is correct! Only Admin can create Managers
- ✅ Managers can only create State Managers and below

### "Employee not showing in hierarchy"
- ✅ Check: Did you create the employee successfully?
- ✅ Check: Is the employee active?
- ✅ Refresh the page

### "Designation dropdown is empty"
- ✅ Check: Your designation might not allow creating any employees
- ✅ Check: Retailers cannot create anyone

## 🎓 Best Practices

### 1. **Territory Assignment**
- Always assign territories to State/District Managers
- Use consistent naming (e.g., "Maharashtra" not "MH")
- Assign areas to Supervisors for better tracking

### 2. **Employee IDs**
- Use consistent format: MGR001, SM001, DM001
- Include designation prefix for easy identification
- Keep sequential numbering

### 3. **Department Assignment**
- Use standard departments: Operations, Sales, Support
- Assign departments for better organization
- Use for filtering and reporting

### 4. **Hierarchy Planning**
- Plan your structure before creating employees
- Start with top-level managers
- Build teams gradually
- Assign territories strategically

## 📞 Support

If you encounter any issues:
1. Check this guide first
2. Review the complete documentation: `EMPLOYEE_HIERARCHY_SYSTEM_COMPLETE.md`
3. Check browser console for errors
4. Verify database connectivity

## 🎉 Success Indicators

You've successfully set up the hierarchy system when:
- ✅ Admin can create managers
- ✅ Managers can create state managers
- ✅ Hierarchy tree displays correctly
- ✅ Designations show on dashboard
- ✅ Menu items appear based on role
- ✅ Territory information displays
- ✅ Employee counts are accurate

## 🚀 Next Steps

1. Create your complete organizational structure
2. Assign territories to all managers
3. Set up employee IDs and departments
4. Train managers on creating their teams
5. Monitor hierarchy through Organization Hierarchy page

---

**Happy Team Building! 🎊**
