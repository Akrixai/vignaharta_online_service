see this now analyze codebase for mobile recharge prepaid and dth recharge prepaid for this ensure for process when any one click on pay button it should hit this api and this GET api-
postman request 'https://www.kwikapi.com/api/v2/recharge.php?api_key=YOUR%20SECRET%20KEY&number=7070300613&amount=10&opid=21&state_code=0&order_id=452145277'
and according to this api response it should hit this api for success and failure and accorring to this respone it should reposne to user friendly depend on api hit response properly so see this sample sucess reponse for this api- 
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
and according to this response it should hit this api for success and failure and accorring to this respone it should reposne to user friendly depend on api hit response properly so see this sample failure reponse for this api-
{
    "status": "FAILURE",
    "order_id": "XXXXXXX",
    "opr_id": "XXXXXXXXXXXXXXXXXXX",
    "balance": "154.78",
    "number": "7070300613",
    "provider": "Vodafone",
    "amount": "10",
    "charged_amount": "9.60",
    "message": "FAILURE"
} 
and according to depend on status we have deduct their money from wallet and according to they will get commision or cashback which set by admin from their page it should means see how we have to show flow do see if any user for mobile recharge prepaid and dth recharge prepaid any one select their plan after selecting their plan then after they click on pay button we have to hit this api and depend on this response of status we have to show their msg and if it sucess status we have to deduct money isntatn from their wallet and give commision to retailer or cashback to customer proerly accprding to set by admin
and also in for mobile recharge in that for VI and airtel that r-offer api also we have to auto hit when number change like plan api for r-offer check api see this full document and accoridng to implment D:\akrix-project\vighnharta\git_vighnaharta\vignaharta_online_service-master\kwikapi_R-offer_checkapi.md it should show all detail in r offer plan modal properly
and  for
so according to this above we have to do for mobile recharge prepaid and dth prepaid in website and also flutter app properlu require implmentions 
and see for 
for mobile postpaid and electricity bill payment for this we have to hit this api for their bill process when any one click on hit api and this GET api
postman request 'https://www.kwikapi.com/api/v2/bills/payments.php?api_key=YOUR%20SECRET%20KEY&number=12438985&amount=1885.00&opid=63&order_id=7485412&opt1=opt1&opt2=opt2&opt3=opt3&opt4=opt4&opt5=opt5&opt6=opt6&opt7=opt7&opt8=Bills&opt9=opt9&opt10=opt10&refrence_id=74013&mobile=Customer%20Mobile%20No.' \
  --header 'Cookie: PHPSESSID=b7c4c5526c0fb2ed3fd60c6b18dd4fd6'
  and sample suces reponse for this api is 
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
and sample failure reponse for this api is
{
    "status": "FAILED",
    "order_id": "2439372",
    "opr_id": "0",
    "balance": "2154.78",
    "number": "12438555985",
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
    "provider": "Andhra Pradesh Southern POWER Distribution Company - APSPDCL",
    "amount": "10",
    "charged_amount": "0",
    "message": "Invalid bill fetch reference id",
    "operator_message": "Invalid or missing bill fetch reference id"
}
so according to this response we have to show msg to user and if it success then we have to deduct money from their wallet and give commision to retailer or cashback to customer proerly accprding to set by admin 
currently when click on pay button it showing error this 
POST https://www.vighnahartaonlineservice.in/api/kwikapi/bill-payment 405 (Method Not Allowed)
❌ Error: Failed to execute 'json' on 'Response': Unexpected end of JSON input

and for mobile postpaid make new seperate page in website and add in layout and also in dashboard and also in flutter mobile screen also mobile postpaid also make new and also add in dashboard and drawer 
so according to for above do proer implmention for mobile postpaid and electricity bill payment  
and for pending status for both api also handle properly means after getting sucess from webhook https://www.vighnahartaonlineservice.in/api/recharge/callback this webhook we have configure at kwikapi dashboard 
