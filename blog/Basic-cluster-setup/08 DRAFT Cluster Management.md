# DRAFT Setup Cluster Management using Flux 2


```
curl -s https://fluxcd.io/install.sh | sudo bash
```

Generate a personal access token to the git repo with read-write access here https://github.com/settings/tokens

```
flux bootstrap github \
    --owner=my-gitlab-user \
    --repository=flux-cluster-01 \
    --branch=main \
    --personal \
    --path=clusters/staging \
    --token-auth
```



## References
* Tutorial for setting up Flux with Git repo monitoring https://docs.technotim.live/posts/flux-devops-gitops/
