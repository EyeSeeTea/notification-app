import { getD2Stub, getNewUser } from '../../utils/testing'
import * as notificationSettings from '../notificationSettings'

const d2 = getD2Stub()

const user = getNewUser({
    email: 'john@server.org',
    phoneNumber: '1234',
    attributeValues: [
        {
            attribute: { id: 'DvrNE5xVYvg' },
            value: 'true',
        },
        {
            attribute: { id: 'U7AVQqIeUKh' },
            value: 'true',
        },
        {
            attribute: { id: 'f6gGk3fgw56' },
            value: 'some text',
        },
    ],
})

const attributes = [
    {
        code: 'user_noInterpretationMentionNotifications',
        id: 'U7AVQqIeUKh',
        displayName: 'OptOut @notification emails',
    },
    {
        code: 'user_noInterpretationSubcriptionNotifications',
        id: 'DvrNE5xVYvg',
        displayName: 'OptOut weekly digest email',
    },
]

const userSettings = {
    keyMessageEmailNotification: true,
    keyMessageSmsNotification: false,
}

function stubApiLoad() {
    const getStub = d2.mocks.api.get
    getStub.reset()
    getStub
        .withArgs('/attributes', {
            paging: false,
            fields: 'id,code,displayName',
            filter:
                'code:in:[user_noInterpretationMentionNotifications,user_noInterpretationSubcriptionNotifications]',
        })
        .returns(Promise.resolve({ attributes }))

        .withArgs('/userSettings')
        .returns(Promise.resolve(userSettings))

        .withArgs('/me')
        .returns(Promise.resolve(user))

    getStub.throws()
}

function stubApiSetUser(payload = {}) {
    const updateStub = d2.mocks.api.update
    updateStub.reset()
    updateStub.withArgs('/me', payload).returns(Promise.resolve(true))
    updateStub.throws()
}

function stubApiSetUserSettings(key, value) {
    const postStub = d2.mocks.api.post
    postStub.reset()
    postStub
        .withArgs(`/userSettings/${key}`, value)
        .returns(Promise.resolve({ status: 'OK' }))
    postStub.throws()
}

function stubApiSetUserAttribute(attributeValues) {
    const getStub = d2.mocks.api.get
    getStub.reset()
    getStub.withArgs('/me').returns(Promise.resolve(user))

    getStub.throws()

    const updateStub = d2.mocks.api.update
    updateStub.reset()
    updateStub
        .withArgs(`/users/${user.id}`, { ...user, attributeValues })
        .returns(Promise.resolve({ status: 'OK' }))
    updateStub.throws()
}

let settings

describe('load', () => {
    beforeEach(stubApiLoad)

    it('loads current settings', async () => {
        settings = await notificationSettings.load(d2)
        expect(settings.get('email')).toEqual('john@server.org')
        expect(settings.get('phone')).toEqual('1234')

        expect(settings.get('emailNotifications')).toEqual(true)
        expect(settings.get('smsNotifications')).toEqual(false)

        expect(settings.get('noMentionNotifications')).toEqual(true)
        expect(settings.get('noNewsletters')).toEqual(true)
    })

    describe('set email', () => {
        beforeEach(() => stubApiSetUser({ email: 'john-new@server.org' }))

        it('persists the value and return new settings', async () => {
            const {
                isValid,
                updated,
                settings: newSettings,
            } = await settings.set('email', 'john-new@server.org')

            expect(isValid).toBe(true)
            expect(updated).toBe(true)
            expect(newSettings.get('email')).toEqual('john-new@server.org')
        })
    })

    describe('set invalid email', () => {
        beforeEach(() => stubApiSetUser({ email: 'wrong-email' }))

        it('does not persist the value but it return new settings', async () => {
            const {
                isValid,
                updated,
                settings: newSettings,
            } = await settings.set('email', 'wrong-email')

            expect(isValid).toBe(false)
            expect(updated).toBe(false)
            expect(newSettings.get('email')).toEqual('wrong-email')
        })
    })

    describe('set phone', () => {
        beforeEach(() => stubApiSetUser({ phoneNumber: '4321' }))

        it('persists the value and return new settings', async () => {
            const {
                isValid,
                updated,
                settings: newSettings,
            } = await settings.set('phone', '4321')

            expect(isValid).toBe(true)
            expect(updated).toBe(true)
            expect(newSettings.get('phone')).toEqual('4321')
        })
    })

    describe('set invalid phone', () => {
        beforeEach(() => stubApiSetUser({ phoneNumber: '4321abc' }))

        it('does not persist the value but it return new settings', async () => {
            const {
                isValid,
                updated,
                settings: newSettings,
            } = await settings.set('phone', '4321abc')

            expect(isValid).toBe(false)
            expect(updated).toBe(false)
            expect(newSettings.get('phone')).toEqual('4321abc')
        })
    })

    describe('set emailNotifications', () => {
        beforeEach(() =>
            stubApiSetUserSettings('keyMessageEmailNotification', false))

        it('persists the value and return new settings', async () => {
            const {
                isValid,
                updated,
                settings: newSettings,
            } = await settings.set('emailNotifications', false)

            expect(isValid).toBe(true)
            expect(updated).toBe(true)
            expect(newSettings.get('emailNotifications')).toEqual(false)
        })
    })

    describe('set smsNotifications', () => {
        beforeEach(() =>
            stubApiSetUserSettings('keyMessageSmsNotification', false))

        it('persists the value and return new settings', async () => {
            const {
                isValid,
                updated,
                settings: newSettings,
            } = await settings.set('smsNotifications', false)

            expect(isValid).toBe(true)
            expect(updated).toBe(true)
            expect(newSettings.get('smsNotifications')).toEqual(false)
        })
    })

    describe('set noMentionNotifications', () => {
        beforeEach(() => {
            stubApiSetUserAttribute([
                { attribute: { id: 'DvrNE5xVYvg' }, value: 'true' },
                { attribute: { id: 'f6gGk3fgw56' }, value: 'some text' },
                { attribute: { id: 'U7AVQqIeUKh' }, value: 'false' },
            ])
        })

        it('persists the value and return new settings', async () => {
            const {
                isValid,
                updated,
                settings: newSettings,
            } = await settings.set('noMentionNotifications', false)

            expect(isValid).toBe(true)
            expect(updated).toBe(true)
            expect(newSettings.get('noMentionNotifications')).toEqual(false)
        })
    })

    describe('set noNewsletters', () => {
        beforeEach(() => {
            stubApiSetUserAttribute([
                { attribute: { id: 'U7AVQqIeUKh' }, value: 'true' },
                { attribute: { id: 'f6gGk3fgw56' }, value: 'some text' },
                { attribute: { id: 'DvrNE5xVYvg' }, value: 'false' },
            ])
        })

        it('persists the value and return new settings', async () => {
            const {
                isValid,
                updated,
                settings: newSettings,
            } = await settings.set('noNewsletters', false)

            expect(isValid).toBe(true)
            expect(updated).toBe(true)
            expect(newSettings.get('noNewsletters')).toEqual(false)
        })
    })
})
