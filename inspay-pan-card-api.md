NSDL API Documentation
New PAN Request
Initiate a new PAN request.

        
            GET https://connect.inspay.in/v4/nsdl/new_pan
            ?username=xxxx
            &token=xxxx
            &number=xxxx
            &mode=EKYC
            &orderid=xxxx
        
        
        
mode: EKYC (for PAN without signature) or ESIGN (for PAN with signature and photo)


    
Success Response:
        
            {
                "txid": 50089349,
                "status": "Success",
                "opid": "Order is under process",
                "message": "Pan Redirection url created",
                "url": "https://connect.inspay.in/nsdl/pan?process_id=2504&txid=5009349&mode=K",
                "number": "7908309991",
                "amount": "107",
                "orderid": ""
            }
        
    
Failure Response:
        
            {
                "status": "Failure",
                "message": "Please enter correct Mobile number, it must be 10 digit"
            }
        
    
PAN Correction Request
Initiate a PAN correction request.

        
            GET https://connect.inspay.in/v4/nsdl/correction
            ?username=xxxx
            &token=xxxx
            &number=xxxx
            &mode=EKYC
            &orderid=xxx
        
    
Success Response:
        
            {
                "txid": 50089349,
                "status": "Success",
                "opid": "Order is under process",
                "message": "Pan Redirection url created",
                "url": "https://connect.inspay.in/nsdl/pan?process_id=2504&txid=5009349&mode=K",
                "number": "7908309991",
                "amount": "107",
                "orderid": "123"
            }
        
    
Failure Response:
        
            {
                "status": "Failure",
                "message": "Please enter correct Mobile number, it must be 10 digit"
            }
        
    
Incomplete PAN Request
Initiate an incomplete PAN request.

        
            GET https://connect.inspay.in/v4/nsdl/incomplete
            ?username=xxxx
            &token=xxxx
            &orderid=xxxx
        
    
Success Response:
        
            {
                "txid": "50089422",
                "status": "Success",
                "opid": "Order is under process",
                "message": "Pan Redirection url created",
                "url": "https://connect.inspay.in/nsdl/pan_inc?process_id=2504&txid=50089422"
            }
        
    
Failure Response:
        
            {
                "txid": "50089422",
                "status": "Failure",
                "message": "URL Expired, please try again with a new request"
            }
        
    
