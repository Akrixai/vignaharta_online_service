# DTH Plans API Implementation Analysis

## Current Statu

### API Endpoint Discovery
According to KWIKAPI documentation, there are TWO different endpoints for fetching plans:

1. **`/api/v2/recharge_plans)

   - Returnstegories

2. **`/api/v2/DTH_plans.php`** - Dedicated DTH plEW)
    `opid`
ns

###es

1. **Wallet Balance Check Me
2. 
ility
4. **Commission/Cashback Visible**: Showingidden)
5. **Wrong API for DTH**: Using `recharge_plans.php` instead of `DTH_plans.php`

## Required Changes

### 1. Wallet BalancL)

**Location**: `src/app/api/recharge/pe.ts`

**Curre:
```
User submits → C
```

**Required Flow**:
```
Useed
```

**Implementation**:
- Check wallet balance BEFORction
- Return clear error messficient
- Apply to ALL service types (PREPAIRICITY)
- Apply to ALL user rolesIN)

s

*:
- **POSTPAID**: Airtel)
ntries)
- **ELECTRICITY**: BESCOM, Goa Electricity, M)

**Solution**: Database migration to keep only one entry per operator

### 3. Operator Filtering

**PREPAID Mobile** - Keep ONLY:
- Airtel Prepaid
- BSNL Prepaid
- Jio Prepaid
aid
- IDEA Prepaid


**POSTPAID Mobile** - Keep ONLY:
- Airtel Postpaid Mobile
- BSNL Postpaid Mobile

- MTNL DELHI – DOLPHIN
- MTNL DOLPHIN – Mumbai Postpaid Mobile
bile

Y:
- AirteV
-TV
- Sun Direct
- Tata Play (Formerly Tatasky)
- Zing TV (Dsh TV)
- D2H Videocon

**ELECTRICITY** - Retes

### 4. Enhanced Operator Dropdown

**Featu to Add**:
- Searonality
- Hide commissates
- Clean
- Alphabetical sortig
- Loading states

### 5. DTH Plans API Sw

**Chahp`
**Chp`

**R

POST /api/v2/DTH_plans.php


api_key=YOUR_KEY
opid=23  // DTH operator ID
```

mat**:
```json
{
  "success": true,
  "operator": "AIRTEL DTH",
  "plans": {
    "TOPUP": [...],
...],
    "COMBO": [...]
  }
}
```

## Implementation Plan

### Phase 1: Database Cleanup (IMMEDIAE)
1. Create migration to removeators
2. Update operator names tots
r


1. Update `/api/rechargete
ginning
3. Return 402 Payment Required
4. Test with all service types

### Phase 3: Frontend Enhancements
1. Add search to operator 
2. Hide commission/cdisplay

4. Add betteressages

### Phase 4: DTH Plans API
1. Update `/api/recharge/plans` route
2. Add conditional logic for DTH service type
3. Use `DTH_plans.php` for DTH operators

igrationity during matibilckward comp batain
- MainresPI failuling for Aror handting eris Keep exlable
-ans not avaiif ply  amount entr customtoallback issue)
- Fization  (authorenabled DTH plans ot havecount may n KWIKAPI ac

-# Notes
#urs
~3.5 ho: *Total**sting)

*minutes (Te 30 *:- **Phase 5*h)
 switc (DTH API45 minutes4**:  **Phase 
-nhancements)tend eour (Fronase 3**: 1 h*Phon)
- *alidatilet v(Walnutes e 2**: 45 mihas **Pleanup)
-tabase c (Daesut 1**: 30 min

- **Phaseeline Time

##r experiencuse
✅ Smooth ent balanceufficir insssages fome error  Clear
✅listh specified tcrs maeratoll opnt
✅ AdpoiPI encorrect A
✅ DTH uses  from usersck hiddenion/cashbass
✅ Commiitytionaluncch fave sear hdownsr drops
✅ OperatoALL rechargeefore ce checked bWallet balance type
✅ any serviors in ate operat No duplica

✅ritericess C Sucsql`

##rator_names.ate_operation: `upd
- New mig.sql`ratorslicate_opeean_duption: `cl migrase
- Newataban

### Ddropdow - Enhanced /page.tsx`ctricitye/elergd/rechaashboarapp/dAPI
- `src/n + new ed dropdowsx` - Enhanch/page.trecharge/dtoard//dashbpp/a `srcown
-ed dropdanctsx` - Enhpage.mobile/arge/rechhboard/das- `src/app/
# Frontend

##od methlans - Add DTH pikapi.ts` `src/lib/kwtering
- fil- Enhancede.ts` rators/routpearge/opi/rechrc/app/a`s new API
- to Switch DTH .ts` -/plans/routergecha/app/api/resrcidation
- `t val - Add walle.ts`ss/routerocei/recharge/psrc/app/apackend
- `# B
##
 Modifys toileng

## Fnd testi. End-to-ety
5tionali funcarcht seI
4. Tesans APpl Test DTH ltering
3.erator fit op
2. Tesrvice typesor all setion fet validaest wall T
1.esting5: Tse 
### Phaat
 formnew response handle frontend toe Updat. paid
5 mobile pres.php` forarge_plan`rechKeep 4. 