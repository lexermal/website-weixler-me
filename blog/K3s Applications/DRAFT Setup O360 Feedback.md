# DRAFT Setup O360 Feedback

UI documentation https://github-com.translate.goog/o360/user-documentation/blob/master/ru/user-guide.md?_x_tr_sl=auto&_x_tr_tl=en&_x_tr_hl=en-US&_x_tr_pto=wapp#%D0%B0%D1%83%D1%82%D0%B5%D0%BD%D1%82%D0%B8%D1%84%D0%B8%D0%BA%D0%B0%D1%86%D0%B8%D1%8F-%D1%87%D0%B5%D1%80%D0%B5%D0%B7-%D1%81%D0%BE%D1%86%D0%B8%D0%B0%D0%BB%D1%8C%D0%BD%D1%8B%D0%B5-%D1%81%D0%B5%D1%82%D0%B8
Infos about backend setup https://github.com/warlockrichard/backend
Infos about frontend setup https://github.com/o360/frontend
Official docu https://o360.github.io/

## Goal on the long run
Setup with LDAP server as auth method

## Setup

Clone demo git repo on a host that can be accessed over a DNS name. Eg wsl.docker.local or test.my-domain.com

Use this adapted docker compose file from o360 demo to deploy the application:

```
version: '3.7'

services:

  postgres:
    image: postgres:12
    environment:
      - POSTGRES_USER=$DATABASE_USER
      - POSTGRES_PASSWORD=$DATABASE_PASSWORD
      - POSTGRES_DB=o360
    volumes:
      - ${PWD}/backend/o360-demo-dump.sql:/docker-entrypoint-initdb.d/o360-demo-dump.sql       
#      - o360-postgres-data:/var/lib/postgresql/data
    networks:
      - private-o360

  auth-server:
    image: python:3.8-alpine
    volumes:
      - ${PWD}/backend/auth-server.py:/auth-server.py
      - ${PWD}/backend/users.csv:/users.csv
    command:
      python auth-server.py
    networks:
      - private-o360

  backend:
    depends_on:
      - postgres
    image: o360/backend
    environment:
      - DATABASE_USER
      - DATABASE_PASSWORD
      - DATABASE_URL=jdbc:postgresql://postgres:5432/o360
      - DATABASE_NAME=o360
      - APPLICATION_SECRET
      - EXTERNAL_AUTH_SERVER_URL=http://auth-server:9090/
      - MAIL_HOST=sumdays.org
      - MAIL_PORT=465
      - MAIL_SSL=yes
      - MAIL_USER=retro@sumdays.org
      - MAIL_PASSWORD=!M3hp9k92
      - MAIL_SEND_FROM=retro@sumdays.org
    volumes:
#      - o360-user-uploads:/opt/docker/uploads
      - ${PWD}/backend/drive_service_key.json:/opt/docker/conf/drive_service_key.json
      - ${PWD}/backend/user_approved.template.html:/opt/docker/templates/user_approved.html    
      - ${PWD}/backend/user_invited.template.html:/opt/docker/templates/user_invited.html      
    networks:
      - private-o360

  frontend:
    image: o360/frontend
    volumes:
      - ${PWD}/frontend/config.json:/var/www/assets/config.json
    networks:
      - private-o360

  web-server:
    depends_on:
      - backend
      - frontend
    image: nginx:alpine
    volumes:
      - ./nginx/:/etc/nginx/conf.d/
    ports:
      - $FE_PORT:80
    networks:
      - private-o360

volumes:
  o360-postgres-data:
    name: o360-postgres-data
  o360-user-uploads:
    name: o360-user-uploads

networks:
  private-o360:
    name: private-o360
```

It might be that the mounts need to be adjusted. 

And the config.json needs to have the right hostname

The env file needs to have the variable HOSTNAME set

## Current limitations
* Users for auth are set in a file, no ldap integration
* Repo is old and no support is given
* Was not able to get a feedback round to be started. Means maybe debugging and creation of own docker containers

