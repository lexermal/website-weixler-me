#!/bin/bash

if [ "$EUID" -ne 0 ]
  then echo "Please run as root."
  exit
fi

# set ssh key
read -p "What is the master ssh public key? " key
echo "$key" >> /root/.ssh/authorized_keys 

echo "
Port 20022
PermitRootLogin yes
PubkeyAuthentication yes
PasswordAuthentication no
" >> /etc/ssh/sshd_config

rm /etc/ssh/sshd_config.d/50-cloud-init.conf
systemctl reload ssh

# Enable Fail2ban
apt install fail2ban -y
sed -i '288ienabled = true' /etc/fail2ban/jail.conf
systemctl enable fail2ban
systemctl start fail2ban

# Install netbird
curl -fsSL https://pkgs.netbird.io/install.sh | sh

# Install required packages for the cluster
apt install bash curl grep gawk open-iscsi nfs-common -y
systemctl enable open-iscsi --now

reboot
