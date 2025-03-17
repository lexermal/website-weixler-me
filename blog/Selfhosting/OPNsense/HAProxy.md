# HAProxy loadbalancing config

## Config a wildcard domain with DNS cert generation

1. Generate a certificate with ACME client.

2. Create a **condition** in the HA proxy:
- Name: c_everything-my-domain-com
- Codition type: Host regex
- Host regex: ^[^\.]+\.my-domain\.com$

3. Create a **Real Server**
- Name: rs_my-host
- IP: 192.168.X.X
- Port: 443
- SSL: true
- Verify SSL certificate: false

4. Create a **Backend Pool**
- Name: bp_my-domain-com
- Mode: HTTP
- Servers: rs_my-host

5. Create a **Rule**
- Name: r_everything-my-domain-com
- Select conditions: c_everything-my-domain-com
- Use backend pool: bp_my-domain-com

6. Create/edit the public service responsible for port 443 traffic
-  SSL offloading: add the certificate
-  Select rules: add r_everything-my-domain-com

Now HAProxy routes all traffic for *.my-domain.com to your host 192.168.x.x on port 443.

## Tips
IF your service is running on a none standard http(s) port like 3000 then the condition needs to match the host based on "abc.example.com:3000". The frontend is not transforming the hostname to match the rule.


## References
* Old tutorial https://forum.opnsense.org/index.php?topic=23339.0
