# Secure VPS that will become part of a Kubernetes Cluster

Reason: Many Self hosted Kubernetes ervers get hacked because security is not taken into causion. Easy example on how it works:
https://raesene.github.io/blog/2022/07/03/lets-talk-about-kubernetes-on-the-internet/




## Securing SSH Access

Make host only accessible via SSH Keys:

```ssh-keygen -t ed25519 -C "my-email@example.com" -f ~/my/folder/id_rsa```

**Always set a password! Otherwise someone can suimply copy the files and access the server like having the stolen password.**


### Add SSH key to client host
Change permissions so it can be added to the ssh agent

sudo chmod 777 id_rsa
sudo chmod 777 id_rsa.pub

Add it to the agent:
ssh-add /my/path/id_rsa


### Secure ssh on server
Log now into the host with ssh root@my-ip

Update the host
sudo apt update
sudo apt upgrade -y

set the following values in sshd_config with

sudo nano /etc/ssh/sshd_config

PubkeyAuthentication yes
PasswordAuthentication no
PermitRootLogin yes
sudo systemctl restart sshd


Should you change the ssh port to avoid attacks? That questions is good answered (here)[https://security.stackexchange.com/questions/32308/should-i-change-the-default-ssh-port-on-linux-servers].

For my setup it would mean to many disadvantages. But it will be secured with Fail2Ban. This is also advisable when the port is changed.


The wheel does not be reinvented, here is a good guide: https://www.digitalocean.com/community/tutorials/how-to-protect-ssh-with-fail2ban-on-ubuntu-22-04

sudo apt install fail2ban -y
cd /etc/fail2ban
sudo cp jail.conf jail.local
sudo nano jail.local

In the section [sshd] add:
enabled = true

sudo systemctl enable fail2ban
sudo systemctl start fail2ban

sudo systemctl status fail2ban

```bash
● fail2ban.service - Fail2Ban Service
     Loaded: loaded (/lib/systemd/system/fail2ban.service; enabled; vendor preset: enabled)
     Active: active (running) since Sun 2022-09-11 11:08:04 CEST; 18s ago
       Docs: man:fail2ban(1)
   Main PID: 1672 (fail2ban-server)
      Tasks: 5 (limit: 38392)
     Memory: 13.5M
        CPU: 144ms
     CGroup: /system.slice/fail2ban.service
             └─1672 /usr/bin/python3 /usr/bin/fail2ban-server -xf start

Sep 11 11:08:04 my-server systemd[1]: Started Fail2Ban Service.
Sep 11 11:08:05 my-server fail2ban-server[1672]: Server ready

```

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
   `- Banned IP list:   <the-list-of-ips>

```