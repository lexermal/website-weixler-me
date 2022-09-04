# Weixler.me Website

## Start website
To run the website run the following commands:
```bash
yarn init-blog
yarn dev
```

## Build
docker build -t registry.weixler.me/website-weixer-me:0.2.0 .

## Run
docker run -p 3000:3000 registry.weixler.me/website-weixer-me:0.2.0

## Useful links
* Icons https://icons.getbootstrap.com/#usage
* Bootstrap https://react-bootstrap.netlify.app/components/alerts/
* AOS Animation Lib https://michalsnik.github.io/aos/

## Blog
When blog entries are adapted the image needs to be rebuild and deployed!