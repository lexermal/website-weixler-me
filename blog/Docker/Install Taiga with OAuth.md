# Setup Taiga with OAuth

In this tutorial I explain how Taiga can be setup with OAuth Authentification against an Authentik Server.

The documentation for the Taiga OAuth projects is pretty bad, so I had to debug the application to find out how it really works. The key is Authentik needs the scope set in the frontend and backend to **openid profile email**.


By using the following **docker-compose.yml** file and adapting the OAuth config you should be safe:

```
version: "3.5"

x-environment:
  &default-back-environment
  # Database settings
  POSTGRES_DB: taiga
  POSTGRES_USER: taiga
  POSTGRES_PASSWORD: taiga
  POSTGRES_HOST: taiga-db
  # Taiga settings
  TAIGA_SECRET_KEY: "taiga-back-secret-key"
  TAIGA_SITES_DOMAIN: "localhost:9000"
  TAIGA_SITES_SCHEME: "http"
  # Email settings. Uncomment following lines and configure your SMTP server
  # EMAIL_BACKEND: "django.core.mail.backends.smtp.EmailBackend"
  # DEFAULT_FROM_EMAIL: "no-reply@example.com"
  # EMAIL_USE_TLS: "False"
  # EMAIL_USE_SSL: "False"
  # EMAIL_HOST: "smtp.host.example.com"
  # EMAIL_PORT: 587
  # EMAIL_HOST_USER: "user"
  # EMAIL_HOST_PASSWORD: "password"
  # Rabbitmq settings
  # Should be the same as in taiga-async-rabbitmq and taiga-events-rabbitmq
  RABBITMQ_USER: taiga
  RABBITMQ_PASS: taiga
  # RabbitMQ Fixes
  CELERY_BROKER_URL: "amqp://taiga:taiga@taiga-async-rabbitmq:5672/taiga"
  EVENTS_PUSH_BACKEND: "taiga.events.backends.rabbitmq.EventsPushBackend"
  EVENTS_PUSH_BACKEND_URL: "amqp://taiga:taiga@taiga-events-rabbitmq:5672/taiga"



  # Telemetry settings
  ENABLE_TELEMETRY: "True"

  # Enable OpenID to allow to register users if they do not exist. Set to false to disable all signups
  PUBLIC_REGISTER_ENABLED: "True"

  # OpenID settings
  ENABLE_OPENID: "True"
  OPENID_USER_URL: "https://auth.my-domain.com/application/o/userinfo/"
  OPENID_TOKEN_URL: "https://auth.my-domain.com/application/o/token/"
  OPENID_CLIENT_ID: "my-client-id"
  OPENID_CLIENT_SECRET: "my-client-secret"
  OPENID_SCOPE: "openid profile email"

x-volumes:
  &default-back-volumes
  - taiga-static-data:/taiga-back/static
  - taiga-media-data:/taiga-back/media
  # - ./config.py:/taiga-back/settings/config.py


services:
  taiga-db:
    image: postgres:12.3
    environment:
      POSTGRES_DB: taiga
      POSTGRES_USER: taiga
      POSTGRES_PASSWORD: taiga
    volumes:
      - taiga-db-data:/var/lib/postgresql/data
    networks:
      - taiga

  taiga-back:
    image: robrotheram/taiga-back-openid
    environment: *default-back-environment
    volumes: *default-back-volumes
    networks:
      - taiga
    depends_on:
      - taiga-db
      - taiga-events-rabbitmq
      - taiga-async-rabbitmq

  taiga-async:
    image: taigaio/taiga-back:latest
    entrypoint: ["/taiga-back/docker/async_entrypoint.sh"]
    environment: *default-back-environment
    volumes: *default-back-volumes
    networks:
      - taiga
    depends_on:
      - taiga-db
      - taiga-back
      - taiga-async-rabbitmq

  taiga-async-rabbitmq:
    image: rabbitmq:3-management-alpine
    environment:
      RABBITMQ_ERLANG_COOKIE: secret-erlang-cookie
      RABBITMQ_DEFAULT_USER: taiga
      RABBITMQ_DEFAULT_PASS: taiga
      RABBITMQ_DEFAULT_VHOST: taiga
    volumes:
      - taiga-async-rabbitmq-data:/var/lib/rabbitmq
    networks:
      - taiga

  taiga-front:
    image: robrotheram/taiga-front-openid
    environment:
      TAIGA_URL: "http://localhost:9000"
      TAIGA_WEBSOCKETS_URL: "ws://localhost:9000"
      ENABLE_OPENID: "true"
      OPENID_URL: "https://auth.my-domain.com/application/o/authorize/"
      OPENID_CLIENT_ID: "my-client-id"
      OPENID_NAME: "Authentik"
      OPENID_SCOPE: "openid profile email"
    networks:
      - taiga
    # volumes:
    #   - ./conf.json:/usr/share/nginx/html/conf.json

  taiga-events:
    image: taigaio/taiga-events:latest
    environment:
      RABBITMQ_USER: taiga
      RABBITMQ_PASS: taiga
      TAIGA_SECRET_KEY: "taiga-back-secret-key"
    networks:
      - taiga
    depends_on:
      - taiga-events-rabbitmq

  taiga-events-rabbitmq:
    image: rabbitmq:3-management-alpine
    environment:
      RABBITMQ_ERLANG_COOKIE: secret-erlang-cookie
      RABBITMQ_DEFAULT_USER: taiga
      RABBITMQ_DEFAULT_PASS: taiga
      RABBITMQ_DEFAULT_VHOST: taiga
    volumes:
      - taiga-events-rabbitmq-data:/var/lib/rabbitmq
    networks:
      - taiga

  taiga-protected:
    image: taigaio/taiga-protected:latest
    environment:
      MAX_AGE: 360
      SECRET_KEY: "taiga-back-secret-key"
    networks:
      - taiga

  taiga-gateway:
    image: nginx:1.19-alpine
    ports:
      - "9000:80"
    volumes:
      - ./taiga-gateway/taiga.conf:/etc/nginx/conf.d/default.conf
      - taiga-static-data:/taiga/static
      - taiga-media-data:/taiga/media
    networks:
      - taiga
    depends_on:
      - taiga-front
      - taiga-back
      - taiga-events

volumes:
  taiga-static-data:
  taiga-media-data:
  taiga-db-data:
  taiga-async-rabbitmq-data:
  taiga-events-rabbitmq-data:

networks:
  taiga:
  ```
  
  Run Taiga by running ```docker-compose up -d```.


