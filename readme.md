# Connecting the CoreMedia GraphQL Schema with the commercetools GraphQL Schema
Run 
```shell
yarn install
```
Then create a .env file and paste:

```shell
COREMEDIA_ENDPOINT=
COREMEDIA_SCHEMA_PREFIX=

CT_PROJECT_KEY=
CT_CLIENT_ID=
CT_CLIENT_SECRET=
CT_SCOPE=
CT_AUTH_HOST=https://auth.europe-west1.gcp.commercetools.com
CT_API_HOST=https://api.europe-west1.gcp.commercetools.com
```

afterwards run
```shell
yarn start
```
and open http://localhost:4000

## Building docker container
```shell
docker build -t <REGISTRY_NAME>/schema-stitching-app .
```

```shell
docker run -p 12345:4000 -e COREMEDIA_ENDPOINT= -e COREMEDIA_SCHEMA_PREFIX= -e CT_PROJECT_KEY=cm-kre-test -e CT_CLIENT_ID= -e CT_CLIENT_SECRET= -e CT_SCOPE= -e CT_AUTH_HOST= -e CT_API_HOST=  <REGISTRY_NAME>/schema-stitching-app:latest
```
