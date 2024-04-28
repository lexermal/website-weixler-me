# Storage management tips for HP servers

## Using used SAS drives
When you use used/refurbished SAS drives it might be that the HP RAID controller does not recognize them as being RAID compatable.

This is because they have a sector size of 520 byte which is common when used in SAN systems. You can verify that in the Smart Storage Administrator.

To get them running again do the following:
1. Set the controller mode to HBA (used P440ar).
2. Boot a Debian operating system on the server (can also be live version on USB stick).
3. Find the disk with ```lsblk```. It will be the disk with 0 byte storage.
4. ```sg_format /dev/sdX``` shows that the block size is e.g. 520.
5. Format the disk to have 512 byte with the following command:
```bash
sg_format -v --format --size=512 /dev/sdX
```
This takes between 2 and 10h.

### (optional) Running formatting in the background
If you want to let it run in the background or format multiple disks at the same time execute the following commands:

1. Start a new session:
   ```bash
   screen -S formatting_sdX
   ```

2. Run `sg_format` interactively in the session:
   ```bash
   sg_format -v --format --size=512 /dev/sdX
   ```

3. Detach from the session by pressing `Ctrl-A` followed by `D`.

4. You can reattach to the session anytime with:
   ```bash
   screen -r formatting_sdX
   ```

## Configure RAID controller withing bare-mattal OS
This tutorial highlights it well: https://www.jimmdenton.com/hp-raid-tools-ubuntu/

## References
* Formatting used SAS disks https://forum.level1techs.com/t/how-to-reformat-520-byte-drives-to-512-bytes-usually/133021
