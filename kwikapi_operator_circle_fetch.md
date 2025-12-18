postman request POST 'https://www.kwikapi.com/api/v2/operator_fetch_v2.php' \
  --header 'Cookie: PHPSESSID=d9d2650d1670a25b2d3f64e3343f7af9' \
   --form 'api_key=' \
   --form 'number=7499113527'
   response- 
   {
    "success": true,
    "message": null,
    "credit_balance": "14877",
    "api_started": null,
    "api_expiry": null,
    "version_details": {
        "version": "v2",
        "role": "Beta",
        "message": "The beta version may occasionally make mistakes as it`s still in the phase of capturing and analyzing data accurately for different use cases. Please cross-check all outputs before proceeding and report with our technical team with full log."
    },
    "details": {
        "provider": "Reliance Jio",
        "opid": "8",
        "circle_code": "Unknown",
        "circle_name": "Unknown"
    }
}