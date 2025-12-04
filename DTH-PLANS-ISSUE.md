## DTH Plans Troubleshooting

Based on KWIKAPI documentation analysis:

### Issue
DTH plans are returning "INVALID OR MISSING PARAMETERS" error even with correct format.

### Possible Causes

1. **DTH Plans May Not Be Available**
   - KWIKAPI might not actually support DTH plans despite documentation
   - DTH services typically don't have "plans" - users enter custom amounts
   
2. **Operator ID Might Be Wrong**
   - opid: 28 (Videocon D2H) might not have plans in KWIKAPI
   - Try other DTH operators: Tata Sky (5), Dish TV (6), Airtel Digital TV (7)

3. **API Limitation**
   - The documentation shows mobile prepaid example, not DTH
   - DTH might only support direct recharge, not plan fetching

### Solution

**For DTH Recharge:**
DTH typically works differently than mobile prepaid:
- No plan selection needed
- User enters DTH Subscriber ID
- User enters any amount (within min/max limits)
- Direct recharge without browsing plans

### Recommendation

Make DTH plans **optional** on the frontend:
- Show "No plans available" message
- Allow users to enter custom amount
- Process recharge without plan selection

This is the standard flow for DTH recharges across most platforms.

### Test with Mobile Prepaid First

To verify the API is working:
1. Go to Mobile Recharge page
2. Select Jio (opid: 8)
3. Select Maharashtra (circle: 4)
4. Plans should load successfully

If mobile plans work but DTH doesn't, it confirms DTH plans are not supported by KWIKAPI.
