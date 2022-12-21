# Developing Software on a Windows PC by having a Linux environment

Sometimes it's unavoidable to work on a Windows PC and still having to develop software. To ensure the comfortable way of Linux and not having to bother with Windows OS configurations we will setup VSCode to work with a Linux environment.

## Setup WSL2
To have a good basis we need WSL2. 

Open the command promt (cmd) as administrator and enter ```wsl.exe --install```.
It will take a while. 
Then you have a full Debian or Ubuntu VM running on your PC. You can now close the command promt.

## Give WSL more power
Out of the box for the Ubuntu WSL host little resources are allocated.

To change this open Powershell as admin and enter the following commands:

```wsl --shutdown``` to shutdown the WSL host.

```notepad "$env:USERPROFILE\.wslconfig"````
It will open Notepad and ask you to create the file, say yes.
Past in it the following lines:
```
[wsl2]
memory=6GB  
processors=6
```

Safe the file and start wsl with ```wsl```. You can close Powershell. WSL will run in the background.

## Configure VSCode

Install (this extension)[https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack], it's from Microsoft to ensure VSCode works well with WSL.

Click on the bottom left icon showing two arrows.
Select **WSL: New WSL Window**. Your window will now load in WSL. 

Have fun developing.
For additional performance boost I would clone the gir repos into /home/user/my-vscode-folder and not use the one from /mnt. The IO performance of WSL2 is poor. You can still access ports from outside of WSL, the are all exposed.

## References
* Tutorial for WSL performance https://dev.to/abhijithganesh/how-to-configure-your-wsl-resources-594m
* Tutorial for installing WSL2 https://www.omgubuntu.co.uk/how-to-install-wsl2-on-windows-10
* Tutorial for WSL in VSCode https://code.visualstudio.com/docs/remote/wsl
