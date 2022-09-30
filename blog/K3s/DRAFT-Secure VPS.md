# Secure VPS

Reason: Many Self hosted Kubernetes ervers get hacked because security is not taken into causion. Easy example on how it works:
https://raesene.github.io/blog/2022/07/03/lets-talk-about-kubernetes-on-the-internet/




## Securing SSH Access

Make host only accessible via SSH Keys:

```ssh-keygen -t ed25519 -C "my-email@example.com" -f ~/my/folder/id_rsa```

**Always set a password! Otherwise someone can suimply copy the files and access the server like having the stolen password.**


### Add SSH key to client host
Change permissions so it can be added to the ssh agent

```
sudo chmod 777 id_rsa
sudo chmod 777 id_rsa.pub
```
Add it to the agent:
ssh-add /my/path/id_rsa


### Secure ssh on server
Log now into the host with ssh root@my-ip

Update the host
```
sudo apt update
sudo apt upgrade -y
```
set the following values in sshd_config with

sudo nano /etc/ssh/sshd_config
```
PubkeyAuthentication yes
PasswordAuthentication no
PermitRootLogin yes
```
sudo systemctl restart sshd

Should you change the ssh port to avoid attacks? That questions is good answered (here)[https://security.stackexchange.com/questions/32308/should-i-change-the-default-ssh-port-on-linux-servers].

For my setup it would mean to many disadvantages. But it will be secured with Fail2Ban. This is also advisable when the port is changed.


The wheel does not be reinvented, here is a good guide: https://www.digitalocean.com/community/tutorials/how-to-protect-ssh-with-fail2ban-on-ubuntu-22-04

```
sudo apt install fail2ban -y
sudo nano /etc/fail2ban/jail.conf
```

In the section [sshd] add:
enabled = true

```
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

sudo systemctl status fail2ban
```

This should state "Server ready".


See the blocked IPs:
fail2ban-client status sshd

```bash
Status for the jail: sshd
|- Filter
|  |- Currently failed: 1
|  |- Total failed:     81
|  `- File list:        /var/log/auth.log
`- Actions
   |- Currently banned: 2
   |- Total banned:     8
   `- Banned IP list:   1.2.3.4

```


## Setup firewall rules
If you have K3s installed with Wireguard you can secure your server with adding the following rules to crontab with ```sudo crontab -e```:

```
@reboot /usr/sbin/iptables -A INPUT -i eth0 -p tcp --destination-port 111 -j DROP
@reboot /usr/sbin/iptables -A INPUT -i eth0 -p tcp --destination-port 6443 -j DROP
@reboot /usr/sbin/iptables -A INPUT -i eth0 -p tcp --destination-port 10250 -j DROP
@reboot /usr/sbin/iptables -A INPUT -i eth0 -p tcp --destination-port 30259 -j DROP
@reboot /usr/sbin/iptables -A INPUT -i eth0 -p tcp --destination-port 31138 -j DROP
```