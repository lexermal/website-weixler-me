# HAProxy loadbalancing config

.....

## Tips
IF your service is running on a none standard http(s) port like 3000 then the condition needs to match the host based on "abc.example.com:3000". The frontend is not transforming the hostname to match the rule.


## References
* Old tutorial https://forum.opnsense.org/index.php?topic=23339.0
