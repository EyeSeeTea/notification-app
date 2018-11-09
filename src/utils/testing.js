import React from 'react'
import puppeteer from 'puppeteer';
import { mount as enzymeMount } from 'enzyme';
import fetch from 'node-fetch';
import _ from 'lodash'
import { init } from 'd2/lib/d2'
import sinon from 'sinon';
import Api from 'd2/lib/api/Api'
import { generateUid } from 'd2/lib/uid'
import createCustomDescribe from "jest-custom-describe";
import OldMuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import { MuiThemeProvider } from '@material-ui/core/styles'

import { muiTheme } from '../dhis2.theme'
import SnackbarProvider from '../feedback/SnackbarProvider.component';

// DHIS2 expects a browser environment, add some required keys to the global node namespace
Object.assign(global, {
    Headers: fetch.Headers,
    window: {},
})

export function mount(component) {
    const wrappedComponent = enzymeMount(
        <MuiThemeProvider theme={muiTheme}>
            <OldMuiThemeProvider>
                <SnackbarProvider>
                    {component}
                </SnackbarProvider>
            </OldMuiThemeProvider>
        </MuiThemeProvider>
    )

    //return wrappedComponent.find(component.type);
    return wrappedComponent;
}

const mocks = {
    api: {
        "get": sinon.stub(),
        "update": sinon.stub(),
        "post": sinon.stub(),
        "delete": sinon.stub(),
    },
};

export function getD2Stub() {
    return {
        Api: {
            getApi: () => mocks.api,
        },
        system: {
            systemInfo: {},
        },
        currentUser: {},
        mocks,
    }
}

const systemAuth = {
    username: 'system',
    password: "System123",
}

function getTestUrl(dhis2UrlTestEnvironmentVariableName) {
    const url = process.env[dhis2UrlTestEnvironmentVariableName]
    if (!url) throw new Error(`Set ${dhis2UrlTestEnvironmentVariableName}`)
    return process.env[dhis2UrlTestEnvironmentVariableName].replace(/\/*$/, '');
}

export async function initD2({ auth }) {
    const baseUrl = getTestUrl('REACT_APP_DHIS2_URL_TEST') + '/api'
    const api = new Api(fetch)
    const {username, password} = auth
    api.setDefaultHeaders({
        Authorization: 'Basic ' + new Buffer(username + ":" + password).toString('base64'),
    })
    const TestApi = { getApi: () => api }
    return init({ baseUrl }, TestApi)
}

export async function getPage(path, {auth}) {
    const dhis2Url = getTestUrl('REACT_APP_DHIS2_URL_TEST');
    const appUrl = getTestUrl('REACT_APP_URL_TEST') + path;
    const headless = process.env.HEADLESS !== undefined ? process.env.HEADLESS === 'true' : true;

    const browser = await puppeteer.launch({
      headless: headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
        const dhis2Page = (await browser.pages())[0] || (await browser.newPage())[0];
        await dhis2Page.goto(dhis2Url)
        await dhis2Page.waitFor("#loginForm");

        await dhis2Page.evaluate(auth => {
            document.querySelector("#j_username").value = auth.username;
            document.querySelector("#j_password").value = auth.password;
            document.querySelector("#submit").click();
        }, auth);

        const appPage = await browser.newPage();
        await appPage.goto(appUrl)

        return {browser, page: appPage};
    } catch (err) {
        browser.close();
        throw err;
    }
}

export function getNewUser(partialUser) {
    const userId = generateUid()

    const baseUser = {
        firstName: 'Test',
        surname: 'User',
        email: 'test@dhis2.org',
        id: userId,
        userCredentials: {
            username: 'test',
            password: 'Test123$',
            userInfo: {
                id: userId,
            },
        },
    }

    return _.merge(baseUser, partialUser)
}

export async function getTestUser(d2, {auth, mergeUser}) {
    const api = d2.Api.getApi();
    const partialUser = _.merge({
        password: auth.password,
        userCredentials: {
            username: auth.username,
        },
    }, mergeUser);
    const user = getNewUser(partialUser);
    const existingTestUser = (await api.get('/users', {
        fields: ":owner",
        filter: 'userCredentials.username:eq:' + auth.username,
    })).users[0]

    let response, returnUser

    if (existingTestUser) {
        returnUser = { ...existingTestUser, ...mergeUser };
        response = await api.update(`/users/${existingTestUser.id}`, returnUser)
    } else {
        returnUser = user
        response = await api.post('/users', returnUser)
    }
    if (response.status !== "OK")
        throw new Error(`Cannot create test use: ${response}`);

    return returnUser;
}

export async function initDhis2App(path, {auth, mergeUser}) {
    const d2Admin = await initD2({auth: systemAuth});
    const user = await getTestUser(d2Admin, {auth, mergeUser});
    const d2 = await initD2({auth});
    const {page, browser} = await getPage(path, {auth})
    const api = d2.Api.getApi();
    const apiAdmin = d2Admin.Api.getApi();
    return { d2, d2Admin, api, apiAdmin, user, page, browser };
}

export function wait(seconds) {
    return new Promise(resolve => setTimeout(resolve, 1000 * seconds));
}

export async function click(page, selector, {afterWait = 0.5} = {}) {
    const handler = await page.$(selector);

    if (handler) {
        await handler.click()
        await wait(afterWait)
    } else {
        throw new Error(`Selector not found: ${selector}`);
    }
}

export async function fill(page, selector, value, {afterWait = 0.5, blurOnFinish = false} = {}) {
    const handler = await page.$(selector);

    if (handler) {
        await handler.focus();
        await handler.click({clickCount: 3}) // select all text
        await handler.press("Backspace")
        await handler.type(value);
        if (blurOnFinish)
            await page.evaluate(selector => document.querySelector(selector).blur(), selector);
        await wait(afterWait)
    } else {
        throw new Error(`Selector not found: ${selector}`);
    }
}

export function getDescribeDhis2App({auth, mergeUser}) {
    let values = {};

    return createCustomDescribe({
        beforeAll: async () => {
            Object.assign(values, await initDhis2App("/", {auth, mergeUser}));
        },
        afterAll: () => {
            if (values.browser)
                return values.browser.close();
        },
        extraArgs: [values],
    });
}

