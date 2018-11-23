## Development

### Setup

```
$ yarn install
```

### Development server

```
$ PORT=8082 REACT_APP_DHIS2_URL="https://play.dhis2.org/dev" yarn start
```

## Tests

### Unit tests

```
$ yarn test
```

### Integration tests

This will start a local server at port 9000 and use play DEV as backend:

```
HEADLESS=false \
    REACT_APP_DHIS2_URL_TEST=https://play.dhis2.org/dev \
    REACT_APP_URL_TEST=http://localhost:9000 \
    START_SERVER=true \
    yarn test:integration
```

## Build distributable ZIP

```
$ yarn build-webapp
```

## Translations

### Update an existing language

```
$ yarn update-po
# ... add/edit translations in po files ...
$ yarn localize
```

### Create a new language

```
$ cp i18n/en.pot i18n/es.po
# ... add translations to i18n/es.po ...
$ yarn localize
```
