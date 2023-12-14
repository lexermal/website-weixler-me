# Setup PrivateBin

```bash
helm repo add privatebin https://privatebin.github.io/helm-chart
```

```yaml
storage:
  storageClass: longhorn
ingress:
  enabled: true
  hosts:
    - host: bin.my-domain.com
      paths:
        - path: "/"
          pathType: Prefix
configs:
   conf.php: |-
    [main]
    name = "My PrivateBin"
    discussion = false
    opendiscussion = false
    password = true
    fileupload = false
    burnafterreadingselected = false
    defaultformatter = "plaintext"
    syntaxhighlightingtheme = "sons-of-obsidian"
    sizelimit = 10485760
    template = "bootstrap-page"
    languageselection = false
    languagedefault = "en"
    qrcode = false
    icon = none
    httpwarning = true
    compression = zlib
    cspheader = "default-src 'none'; manifest-src 'self' https://accounts.google.com/; connect-src * blob:; script-src 'self' 'unsafe-eval' https://accounts.google.com/; style-src 'self'; font-src 'self' data: font/woff:; img-src 'self' data: blob:; media-src blob:; object-src blob:; sandbox allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
    [expire]
    default = "1day"
    [expire_options]
    10min = 600
    1hour = 3600
    1day = 86400
    1week = 604800
    [formatter_options]
    plaintext = "Plain Text"
    syntaxhighlighting = "Source Code"
    markdown = "Markdown"
    [traffic]
    limit = 100
    header = "X_FORWARDED_FOR"
    dir = PATH "data"
    [purge]
    limit = 300
    batchsize = 10
    dir = PATH "data"
    [model]
    class = Filesystem
    [model_options]
    dir = PATH "data"
```

```bash
helm upgrade -i bin privatebin/privatebin -f values.yml -n my-bin --create-namespace
```

## References
* Medium tutorial https://medium.com/@Amet13/privatebin-369ffe5f4e6b
* Helm install instructions https://github.com/PrivateBin/helm-chart/tree/master
* Configuration options https://github.com/PrivateBin/PrivateBin/wiki/Configuration
* Example configuration https://github.com/PrivateBin/PrivateBin/blob/master/cfg/conf.sample.php
* Values.yml https://github.com/PrivateBin/helm-chart/blob/master/charts/privatebin/values.yaml
