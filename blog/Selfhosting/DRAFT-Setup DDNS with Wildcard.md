

dynu.com

## Update client
https://www.dynu.com/DynamicDNS/IPUpdateClient/DDClient

sudo nano /etc/ddclient.conf

    daemon=60 \
    protocol=dyndns2 \
    use=web, web=https://api.ipify.org/ \
    server=api.dynu.com \
    login=my-username \
    password='my-password' \
    my-dns-name.selected-dns.org

reboot

service ddclient status
