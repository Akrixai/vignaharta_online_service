POST- postman request POST 'https://www.kwikapi.com/api/v2/operatorFetch.php' \
   --form 'api_key=7f4a43-7c2711-25d253-4750d7-8bc5be' \
   --form 'opid=53'

{
    "success": true,
    "STATUS": "SUCCESS",
    "operator_name": "Vodafone Idea FAP",
    "operator_id": "282",
    "service_type": "Postpaid",
    "status": "1",
    "biller_status": "on",
    "bill_fetch": "YES",
    "supportValidation": "NOT_SUPPORTED",
    "bbps_enabled": "YES",
    "message": "NA",
    "description": "",
    "amount_minimum": "10",
    "amount_maximum": "49999",
    "parameters": [
        {
            "opt1/param1": "Mobile Number"
        },
        {
            "opt2/param2": null
        },
        {
            "opt3/param3": null
        },
        {
            "opt4/param4": null
        },
        {
            "opt5/param5": null
        },
        {
            "opt6/param6": null
        },
        {
            "opt7/param7": null
        },
        {
            "opt8/param8": null
        },
        {
            "opt9/param9": null
        },
        {
            "opt10/param10": null
        },
        {
            "opt11/param11": null
        },
        {
            "opt12/param12": ""
        }
    ],
    "updated_at": null,
    "deactivated_at": null,
    "biller_payment_modes": null,
    "payment_channel_info": null,
    "payment_modes_count": 0,
    "payment_channels_count": 0,
    "is_synced": false
}

after this api we have to according to their require parameter handilng dynmic parameter at backend and also at frontend according to we have to call bill fetch api GET api https://www.kwikapi.com/api/v2/bills/validation.php?api_key=YOUR SECRET KEY&number=12438555985&amount=10&opid=65&order_id=478245232&opt1=opt1&opt2=opt2&opt3=opt3&opt4=opt4&opt5=opt5&opt6=opt6&opt7=opt7&opt8=Bills&opt9=opt9&opt10=opt10&mobile=Customer Mobile No.                  
    
    after this for process we have to hit this api for submit request for process utility bill payment means for mobile postpaid and electricity bill postman request 'https://www.kwikapi.com/api/v2/bills/payments.php?api_key=YOUR%20SECRET%20KEY&number=12438985&amount=1885.00&opid=63&order_id=7485412&opt1=opt1&opt2=opt2&opt3=opt3&opt4=opt4&opt5=opt5&opt6=opt6&opt7=opt7&opt8=Bills&opt9=opt9&opt10=opt10&refrence_id=74013&mobile=Customer%20Mobile%20No.' \

  --header 'Cookie: PHPSESSID=b7c4c5526c0fb2ed3fd60c6b18dd4fd6' 
GET API
this api we have to and this sample sucss response of this  
{
    "status": "SUCCESS",
    "order_id": "2439418",
    "opr_id": "BR0106989",
    "balance": "271.67",
    "number": "124385985",
    "optional1": "opt1",
    "optional2": "opt2",
    "optional3": "opt3",
    "optional4": "opt4",
    "optional5": "opt5",
    "optional6": "opt6",
    "optional7": "opt7",
    "optional8": "Billls",
    "optional9": "opt9",
    "optional10": "opt10",
    "provider": "North Bihar power distribution company ltd - NBPDCL",
    "amount": "1885.00",
    "charged_amount": "1850",
    "message": "REQUEST SUBMITED SUCCESSFULLY."
}
according to this we have show realtime status of bill payment on frontend to user and also message also we have to show realtime and according to we have to show in recharge history page means how kwikapi flow works when we hit this api it check kwikapi balance and accoridng to that it give reponse if balance is not there it give fail acording to we have to show theiir response realtime to user means currently what we is our flow if any one have balance in our wallet and try to do any recharge or bill payment it prcced and show in pending state in transaction history page this flow is wrong we have to implment according to kwik api means we have tos how their realtime status and message to user proerly and also that webhook response also 
and for prepaid payment which is for mobile prepaid and dth prepaid for this procees reques their we have to hit this  api postman request 'https://www.kwikapi.com/api/v2/recharge.php?api_key=YOUR%20SECRET%20KEY&number=7070300613&amount=10&opid=21&state_code=0&order_id=452145277' GET API
and acocrding to this api give response we have to show that status and message to user and also we have to show in transaction history page and also we have to show in pending state means if any one hit this api and try to do any recharge or bill payment it prcced and show in pending state in transaction history page this flow is wrong we have to implment according to kwik api means we have to show their realtime status and message to user proerly and also that webhook response also which we get from kwikapi and see thsi sample sucess response of this api
{
    "status": "SUCCESS",
    "order_id": "2426662",
    "opr_id": "RBR2007061002310020",
    "balance": "154.78",
    "number": "7070300613",
    "provider": "Vodafone",
    "amount": "10",
    "charged_amount": "9.60",
    "message": "SUCCESS"
}