import i18n from '@dhis2/d2-i18n'
import { Validators } from '@dhis2/d2-ui-forms'

import _ from 'lodash'

class NotificationSettings {
    static userSettings = {
        emailNotifications: 'keyMessageEmailNotification',
        smsNotifications: 'keyMessageSmsNotification',
    }

    static userFields = {
        email: 'email',
        phone: 'phoneNumber',
    }

    static attributeCodes = {
        noMentionNotifications: 'user_noInterpretationMentionNotifications',
        noNewsletters: 'user_noInterpretationSubcriptionNotifications',
    }

    static validators = {
        email: [
            {
                validator: Validators.isEmail,
                message: i18n.t('Invalid email'),
            },
        ],
        phone: [
            {
                validator: value => !!value.match(/^[\d\s+]*$/),
                message: i18n.t('Invalid phone number'),
            },
        ],
    }

    constructor(d2, attributes, settings) {
        this.d2 = d2
        this.attributes = attributes
        this.api = d2.Api.getApi()
        this.settings = settings
    }

    updateValue(key, newValue, { error = null, isValid = true } = {}) {
        const newSettings = { ...this.settings, [key]: newValue }

        return _.omitBy(
            {
                isValid,
                error,
                updated: isValid && !error,
                settings: new NotificationSettings(this.d2, this.attributes, newSettings),
            },
            _.isNull
        )
    }

    async updateUserSetting(key, newValue) {
        const userSettingKey = NotificationSettings.userSettings[key]
        const url = `/userSettings/${userSettingKey}`
        const res = await this.api.post(url, newValue)
        const error = res.status === 'OK' ? null : res.message
        return this.updateValue(key, newValue, { error })
    }

    async updateUserField(key, newValue) {
        const userFieldKey = NotificationSettings.userFields[key]
        await this.api.update('/me', { [userFieldKey]: newValue })
        return this.updateValue(key, newValue)
    }

    async updateUserAttribute(key, newValue) {
        const user = await this.api.get('/me')
        const attributeCode = NotificationSettings.attributeCodes[key]
        const attributesByCode = _(this.attributes)
            .values()
            .keyBy('code')
        const attributeId = attributesByCode.get(attributeCode).id
        const newAttributeValue = {
            attribute: { id: attributeId },
            value: newValue.toString(),
        }
        const newAttributeValues = _(user.attributeValues)
            .filter(attributeValue => attributeValue.attribute.id !== attributeId)
            .concat([newAttributeValue])
            .value()
        const newUser = { ...user, attributeValues: newAttributeValues }

        // PUT /users/ID works only if the user has the authority F_USER_ADD
        // Cannot use PUT /me, it does not update attributeValues (DHIS2-5152)
        await this.api.update(`/users/${user.id}`, newUser)
        return this.updateValue(key, newValue)
    }

    static async getAttributes(api) {
        const { attributes } = await api.get('/attributes', {
            paging: false,
            fields: 'id,code,displayName',
            filter: `code:in:[${_(this.attributeCodes).values().join(',')}]`,
        })
        return attributes
    }

    static async getCurrentSettings(api, attributesById) {
        const user = await api.get('/me')
        const userSettings = await api.get('/userSettings')
        const attributeValuesByCode = _(user.attributeValues)
            .filter(attributeValue => _(attributesById).has(attributeValue.attribute.id))
            .map(attributeValue =>
                [attributesById[attributeValue.attribute.id].code, attributeValue.value])
            .fromPairs()
            .value()
        const boolAttribute = stringValue => stringValue === 'true'

        return {
            emailNotifications: userSettings.keyMessageEmailNotification,
            smsNotifications: userSettings.keyMessageSmsNotification,
            noMentionNotifications: boolAttribute(
                attributeValuesByCode.user_noInterpretationMentionNotifications
            ),
            noNewsletters: boolAttribute(
                attributeValuesByCode.user_noInterpretationSubcriptionNotifications
            ),
            email: user.email,
            phone: user.phoneNumber,
        }
    }

    _set(key, newValue) {
        switch (key) {
            case 'emailNotifications':
            case 'smsNotifications':
                return this.updateUserSetting(key, newValue)
            case 'email':
            case 'phone':
                return this.updateUserField(key, newValue)
            case 'noMentionNotifications':
            case 'noNewsletters':
                return this.updateUserAttribute(key, newValue)
            default:
                return Promise.reject(`Setting not found: ${key}`)
        }
    }

    /* Public interface */

    /* Return value for key */
    get(key) {
        if (!this.settings.hasOwnProperty(key)) {
            throw new Error(`Setting not found: ${key}`)
        } else {
            return this.settings[key]
        }
    }

    /* Set new value for key, return object {isValid, error, settings} */
    async set(key, newValue) {
        const isValid = _(NotificationSettings.validators[key])
            .toArray()
            .every(validator => validator.validator(newValue))

        if (!isValid) {
            return Promise.resolve(
                this.updateValue(key, newValue, { isValid: false })
            )
        } else {
            return this._set(key, newValue).catch(err =>
                this.updateValue(key, newValue, { error: err })
            )
        }
    }

    /* Return the current settings from DB */
    static async load(d2) {
        const api = d2.Api.getApi()
        const attributes = await NotificationSettings.getAttributes(api)
        const missingAttributes = _(NotificationSettings.attributeCodes)
            .values()
            .difference(attributes.map(attr => attr.code))
            .value()

        if (!_(missingAttributes).isEmpty()) {
            throw new Error(
                `Attributes not found: ${missingAttributes.join(', ')}`
            )
        } else {
            const attributesById = _.keyBy(attributes, 'id')
            const settings = await NotificationSettings.getCurrentSettings(api, attributesById)
            return new NotificationSettings(d2, attributesById, settings)
        }
    }
}

const load = NotificationSettings.load
const validators = NotificationSettings.validators

export { load, validators }
