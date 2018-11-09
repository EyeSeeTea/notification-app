## Development

Setup:

```
$ yarn install
```

Start development server:

```
$ yarn start
```

This will open the development server at port 8081 and will connect to DHIS 2 instance http://localhost:8080.

Use custom values passing environment variables. An example:

$ PORT=8082 REACT_APP_DHIS2_URL="https://play.dhis2.org/dev" yarn start

## Tests

Unit tests:

```
$ yarn test
```

Integration tests:

```
REACT_APP_DHIS2_URL_TEST=http://localhost:8080 REACT_APP_URL_TEST=http://localhost:8081 yarn test:integration
```

Pass `HEADLESS=false` to see the browser.

## Build

```
$ yarn build-webapp
```

## i18n

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
