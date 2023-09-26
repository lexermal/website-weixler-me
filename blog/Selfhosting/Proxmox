# Proxmox tips


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
