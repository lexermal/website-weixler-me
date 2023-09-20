# UPS config

This tutorial describes how a Greencell UPS can be connected with a RaspberryPI so that it serves at NUT server.


Add to /etc/nut/ups.conf the following


```
[greencell]
        driver = nutdrv_qx
        port = auto
        vendorid = 0001
        productid = 0000
        desc = "UPS"
        default.battery.voltage.high = 25.60
        default.battery.voltage.low = 20.80
        override.battery.packs=2
        override.battery.charge.low = 30
```

Remove the maxretry line.

The rest is applying the tutorial from TechnoTim https://technotim.live/posts/NUT-server-guide/#nut-ups-server
