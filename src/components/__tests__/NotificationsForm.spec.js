import React from 'react'
import CircularProgress from '@material-ui/core/CircularProgress/CircularProgress'
import { FormBuilder } from '@dhis2/d2-ui-forms'

import { getD2Stub, mount } from '../../utils/testing'
import NotificationsForm from '../NotificationsForm'
import * as notificationSettings from '../../models/notificationSettings'

function render({ props } = {}) {
    const fullProps = { d2: getD2Stub(), ...props }
    return mount(<NotificationsForm {...fullProps} />)
}

class MockSettings {
    constructor(settings) {
        this.settings = settings
    }

    get(key) {
        return this.settings[key]
    }

    set(key, newValue) {
        const newSettings = new MockSettings({
            ...this.settings,
            [key]: newValue,
        })
        return Promise.resolve({
            isValid: true,
            updated: true,
            settings: newSettings,
        })
    }
}

let component

describe('NotificationsForm', () => {
    beforeAll(() => {
        const settings = new MockSettings({
            email: 'user@server.org',
            emailNotifications: true,
            noMentionNotifications: false,
            noNewsletters: false,
            phone: '1234',
            smsNotifications: false,
        })

        notificationSettings.load = jest.fn(() => Promise.resolve(settings))
        component = render()
    })

    describe('when unmounted', () => {
        it('renders CircularProgress', () => {
            expect(component.find(CircularProgress)).toHaveLength(1)
        })
    })

    describe('when mounted', () => {
        beforeAll(async () => {
            component.update()
        })

        it('renders form builder', () => {
            expect(component.find(FormBuilder)).toHaveLength(2)
        })

        describe('on field updated', () => {
            beforeAll(async () => {
                const formBuilder = component.find(FormBuilder).first()
                await formBuilder
                    .props()
                    .onUpdateField('email', 'email-new@server.org')
            })

            it('updates settings', () => {
                const { settings } = component.find(NotificationsForm).state()
                expect(settings.get('email')).toEqual('email-new@server.org')
            })
        })
    })
})
