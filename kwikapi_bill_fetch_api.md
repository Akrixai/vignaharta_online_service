GET API
postman request 'https://www.kwikapi.com/api/v2/bills/validation.php?api_key=7f4a43-7c2711-25d253-4750d7-8bc5be&number=9152906141&amount=10&opid=282&order_id=95926523&opt1=9152906141&opt2=Bhiwandi&opt3=opt3&opt4=opt4&opt5=opt5&opt6=opt6&opt7=opt7&opt8=Bills&opt9=opt9&opt10=opt10&mobile=9819399470' \
  --header 'Cookie: PHPSESSID=b7c4c5526c0fb2ed3fd60c6b18dd4fd6'

sucess reponse sample- 
{
    "status": "SUCCESS",
    "message": "SUCCESS",
    "due_amount": "1885.00",
    "due_date": "13-07-2020",
    "customer_name": "KUSUM DEVI",
    "bill_number": "202006005985",
    "bill_date": "28-06-2020",
    "bill_period": "MONTHLY",
    "ref_id": "61936"
}
failure response sample-
{
    "status": "FAILED",
    "message": "Invalid Account Number",
    "due_amount": "NA",
    "due_date": "NA",
    "customer_name": "NA",
    "bill_number": "NA",
    "bill_date": "NA",
    "bill_period": "NA",
    "ref_id": "NA"
}