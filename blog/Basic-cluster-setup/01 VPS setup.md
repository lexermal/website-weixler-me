# Secure VPS

Reason: Many self-hosted Kubernetes servers get hacked because security is not taken into caution. This blog article explains the issue well [link](https://raesene.github.io/blog/2022/07/03/lets-talk-about-kubernetes-on-the-internet/).


## Securing SSH Access

Make host only accessible via SSH Keys:

```ssh-keygen -t ed25519 -C "my-email@example.com"```

**Always set a password! Otherwise someone can suimply copy the files and access the server like having the stolen password.**

Log now into the host with ```ssh username@my--server-ip```.

Open the file **./ssh/authorized_keys** and add at the bottom a new line with your public ssh key.

## Change hostname
Change the hostname to something easily rememberable:

```sudo hostnamectl set-hostname my-host-123```

### Disable password login
Open the ssh settings with ```sudo nano /etc/ssh/sshd_config```

Change the settings to these once:
```
PasswordAuthentication no
PermitRootLogin yes
PubkeyAuthentication yes
```
Restart the SSH service with 
```sudo systemctl restart sshd``` or ```sudo systemctl restart ssh```



## Enable Fail2ban
In order to prevent attacks we enable Fail2Ban.


```
sudo apt install fail2ban -y
sudo nano /etc/fail2ban/jail.conf
```

At around line 280 in the section [sshd] add:
enabled = true

```
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

sudo systemctl status fail2ban
```

This should state "Server ready".


See the blocked IPs:
```fail2ban-client status sshd```

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






## References
* Setup and configuration of Fail2Ban https://www.digitalocean.com/community/tutorials/how-to-protect-ssh-with-fail2ban-on-ubuntu-22-04
* Adding SSH keys to server https://www.digitalocean.com/community/tutorials/how-to-configure-ssh-key-based-authentication-on-a-linux-server
*
