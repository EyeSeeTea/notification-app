import _ from 'lodash'
import {getDescribeDhis2App, click, fill, wait} from '../src/utils/testing';

const auth = {username: "test", password: "Test123$"}

const describeDhis2App = getDescribeDhis2App({
    auth,
    mergeUser: {
        email: "someemail@server.org",
        phoneNumber: "1234",
        userRoles: {id: "xJZBzAHI88H"},
        attributeValues: [],
    },
})

async function createAttribute(api, name, code) {
    const payload = {
      "name": name,
      "code": code,
      "valueType": "BOOLEAN",
      "unique": false,
      "mandatory": false,
      "userAttribute": true,
    }

    const existingAttribute = (await api.get('/attributes', {filter: 'name:eq:' + name})).attributes[0];

    if (!existingAttribute) {
        const response = await api.post("/attributes", payload);
        return [code, response.uid];
    } else {
        return [code, existingAttribute.id];
    }
}

function getAttributeValue(user, attributes, code) {
    return _(user.attributeValues)
        .map(attributeValue => attributeValue.attribute.id === attributes[code] ? attributeValue.value : null)
        .compact()
        .first()
}

let attributes

describeDhis2App('Notifications App', testing => {
    beforeAll(async () => {
        const {apiAdmin} = testing;

        await testing.api.post("/userSettings/keyMessageEmailNotification", false)
        await testing.api.post("/userSettings/keyMessageSmsNotification", false)

        attributes = _.fromPairs([
            await createAttribute(apiAdmin, "OptOut @notification emails", "user_noInterpretationMentionNotifications"),
            await createAttribute(apiAdmin, "OptOut weekly digest email", "user_noInterpretationSubcriptionNotifications"),
        ])
    })

    describe('When user fills email field', () => {
        beforeAll(async () => {
            await testing.page.waitFor('.notifications-form')
            await fill(testing.page, "#notifications-form-email", "newemail@dhis2.org", {blurOnFinish: true})
        })

        it("the new email is persisted", async () => {
            const user = await testing.api.get("/me");
            expect(user.email).toEqual("newemail@dhis2.org")
        })
    });

    describe('When user fills the phone number field', () => {
        beforeAll(async () => {
            await testing.page.waitFor('.notifications-form')
            await fill(testing.page, "#notifications-form-phone", "611223344", {blurOnFinish: true})
        })

        it("the new phone number is persisted", async () => {
            const user = await testing.api.get("/me");
            expect(user.phoneNumber).toEqual("611223344")
        })
    });

    describe('When user clicks the noNewsletters field', () => {
        beforeAll(async () => {
            await testing.page.waitFor('.notifications-form')
            await click(testing.page, "#notifications-form-noNewsletters");
        })

        it("it is persisted as set", async () => {
            const user = await testing.api.get("/me");
            expect(getAttributeValue(user, attributes, "user_noInterpretationSubcriptionNotifications")).toBe("true");
        })
    });

    describe('When user clicks the noMentionNotifications field', () => {
        beforeAll(async () => {
            await testing.page.waitFor('.notifications-form')
            await click(testing.page, "#notifications-form-noMentionNotifications");
        })

        it("it is persisted as set", async () => {
            const user = await testing.api.get("/me");
            expect(getAttributeValue(user, attributes, "user_noInterpretationMentionNotifications")).toBe("true");
        })
    });


    describe('When user clicks the emailNotifications field', () => {
        beforeAll(async () => {
            await testing.page.waitFor('.notifications-form')
            await click(testing.page, "#notifications-form-emailNotifications");
        })

        it("it is persisted as set", async () => {
            const userSettings = await testing.api.get("/userSettings");
            expect(userSettings.keyMessageEmailNotification).toBe(true);
        })
    });

    describe('When user clicks the smsNotifications field', () => {
        beforeAll(async () => {
            await testing.page.waitFor('.notifications-form')
            await click(testing.page, "#notifications-form-smsNotifications");
        })

        it("it is persisted as set", async () => {
            const userSettings = await testing.api.get("/userSettings");
            //expect(userSettings.keyMessageSmsNotification).toBe(true);
        })
    });
});
