# Check domain availability

The following script helps checking for all available domains.

Create a file named **domain-lookup.js** and past it the following content:
```javascript
import fetch from "node-fetch";
import {promises} from "dns";

const domain = "my-domain";   // <-- adapt to your domain

async function hostnameExists(hostname) {
    console.info("Checking domain " + hostname);
    try {
      await promises.lookup(hostname);
      return { hostname, exists: true };
    } catch (_) {
      return { hostname, exists: false };
    }
  }


fetch("https://data.iana.org/TLD/tlds-alpha-by-domain.txt").then(e=>e.text()).then(domains=>{
    const domainArray = domains.toLowerCase().split("\n").filter((d, i) => i !== 0 && !d.includes("xn--"));

    Promise.all(domainArray.map(tld => {
        return hostnameExists(domain + "." + tld).then((status) => {
            console.info("Domain status for " + status.hostname + ": " + (status.exists ? "unavailable" : "available"));
            return status;
        });
    })).then(domainList => {
        console.info("Summary:");
        console.info("Available: " + domainList.filter(d => !d.exists).map(d=>d.hostname).join(", "));
        console.info("Unavailable: " + domainList.filter(d => d.exists).map(d => d.hostname).join(", "));
    });
});
```

Create a file called package.json and paste in the following
```json
{
  "name": "domain lookup",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "node-fetch": "^2.6.1"
  }
}
```

Run ```npm i```

It can be executed with ```node ./domain-lookup.js```
