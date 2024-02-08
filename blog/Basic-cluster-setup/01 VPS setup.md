# Secure VPS

Reason: Many self-hosted Kubernetes servers get hacked because security is not taken into caution. This blog article explains the issue well [link](https://raesene.github.io/blog/2022/07/03/lets-talk-about-kubernetes-on-the-internet/).


## Securing SSH Access

Make host only accessible via SSH Keys:

```ssh-keygen -t ed25519 -C "my-email@example.com"```

**Always set a password! Otherwise someone can simply copy the files and access the server like having the stolen password.**

Log now into the host with ```ssh username@my--server-ip```.

Open the file **~/.ssh/authorized_keys** and add a new line with your public ssh key at the bottom.

### Disable password login
Open the ssh settings with ```sudo nano /etc/ssh/sshd_config```

Change the settings to these once:
```
Port 2222
PermitRootLogin yes
PubkeyAuthentication yes
PasswordAuthentication no
```
Restart the SSH service with 

```sudo systemctl reload ssh```

## Enable Fail2ban
To prevent attacks, we enable Fail2Ban.


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


You can see the blocked IPs with ```fail2ban-client status sshd```





## References
* Setup and configuration of Fail2Ban https://www.digitalocean.com/community/tutorials/how-to-protect-ssh-with-fail2ban-on-ubuntu-22-04
* Adding SSH keys to server https://www.digitalocean.com/community/tutorials/how-to-configure-ssh-key-based-authentication-on-a-linux-server
