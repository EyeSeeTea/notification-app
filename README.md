## Development

### Setup

```shell
$ yarn install
$ curl -H "Content-Type: application/json" -X POST -u 'USERNAME:PASSWORD' "http://localhost:8080/api/metadata"  -d@src/metadata/attributes.json
```

### Development server

```shell
$ PORT=8082 REACT_APP_DHIS2_URL="https://play.dhis2.org/dev" yarn start
```

## Tests

### Unit tests

```shell
$ yarn test
```

### Integration tests

This will start a local server at port 9000 and use play DEV as backend:

```shell
$ HEADLESS="false" \
    REACT_APP_DHIS2_URL_TEST="https://play.dhis2.org/dev" \
    REACT_APP_URL_TEST="http://localhost:9000" \
    START_SERVER="true" \
    yarn test:integration
```

## Build distributable ZIP

```shell
$ yarn build-webapp
```

## Translations

### Update an existing language

```shell
$ yarn update-po
# ... add/edit translations in po files ...
$ yarn localize
```

### Create a new language

```shell
$ cp i18n/en.pot i18n/es.po
# ... add translations to i18n/es.po ...
$ yarn localize
```
