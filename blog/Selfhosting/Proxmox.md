# Proxmox tips

## Setup up NAT
Let's say your hoster gave you only one public up but you want your VMs to access the internet for e.g. downloading updates.

1. Create network bridge vmbr1 with ip range 192.168.50.0/24

2. Edit /etc/network/interfaces and add the following under "bridge-fd 0":

        post-up   echo 1 > /proc/sys/net/ipv4/ip_forward
        post-up   iptables -t nat -A POSTROUTING -s '192.168.50.0/24' -o vmbr0 -j MASQUERADE
        post-down iptables -t nat -D POSTROUTING -s '192.168.50.0/24' -o vmbr0 -j MASQUERADE

3. Comment out the "up ip route replace" route

4. Restart the host
5. In the VM set the following network settings

* Subnet: 192.168.50.0/24
* Address: 192.168.50.2
* Gateway: 192.168.50.1
* Name servers: 1.1.1.1

## Setup port forwarding

Edit /etc/network/interfaces and add the following under "bridge-fd 0":
```
        post-up   iptables -t nat -A PREROUTING -i vmbr0 -p tcp --match multiport --dports 1:8000 -j DNAT --to-destination 192.168.50.2
        post-up   iptables -t nat -A POSTROUTING -o vmbr0 -p tcp --match multiport --dports 1:8000 -j MASQUERADE
        post-down iptables -t nat -A PREROUTING -i vmbr0 -p tcp --match multiport --dports 1:8000 -j DNAT --to-destination 192.168.50.2
        post-down iptables -t nat -A POSTROUTING -o vmbr0 -p tcp --match multiport --dports 1:8000 -j MASQUERADE
```

## Setup NAT hairpinning
This enables internal services to reach themselves over the public IP.

```my-public-ip``` needs to be adapted.
```
        post-up iptables -t nat -A PREROUTING -s 192.168.50.0/24 -d my-public-ip -p tcp --match multiport --dports 1:8000 -j DNAT --to-destination 192.168.50.2
        post-up iptables -t nat -A PREROUTING -s 192.168.50.0/24 -d my-public-ip -p udp --match multiport --dports 1:8000 -j DNAT --to-destination 192.168.50.2
        post-up iptables -t nat -A POSTROUTING -s 192.168.50.0/24 -d 192.168.50.2 -p tcp --match multiport --dports 1:8000 -j MASQUERADE
        post-up iptables -t nat -A POSTROUTING -s 192.168.50.0/24 -d 192.168.50.2 -p udp --match multiport --dports 1:8000 -j MASQUERADE
```

## Troubleshooting

### VM is after cloning getting the same IP as the machine it got cloned from

Reset the machine id:
```bash
echo -n >/etc/machine-id
rm /var/lib/dbus/machine-id
ln -s /etc/machine-id /var/lib/dbus/machine-id
reboot
```

Source: https://forum.proxmox.com/threads/cloned-vm-has-same-ip-address-as-original.117169/ 
