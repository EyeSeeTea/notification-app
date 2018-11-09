import React from 'react'
import PropTypes from 'prop-types'

import _ from 'lodash'

import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import CircularProgress from '@material-ui/core/CircularProgress/CircularProgress'
import Typography from '@material-ui/core/Typography'

import i18n from '@dhis2/d2-i18n'
import { FormBuilder } from '@dhis2/d2-ui-forms'
import { CheckBox } from '@dhis2/d2-ui-core'
import { TextField } from '@dhis2/d2-ui-core'

import {
    load as loadSettings,
    validators,
} from '../models/notificationSettings'
import feedbackContext from '../feedback/context'

class NotificationsForm extends React.Component {
    static contextType = feedbackContext

    static propTypes = {
        d2: PropTypes.object.isRequired,
    }

    styles = {
        cardContent: { width: 800 },
        textField: { width: '100%' },
    }

    state = {
        state: 'loading',
        settings: null,
        error: null,
    }

    onUpdateField = async (fieldName, newValue) => {
        const { settings } = this.state
        const { error, updated, settings: newSettings } = await settings.set(fieldName, newValue)

        if (error) {
            this.context.error(error.message || error.toString())
        } else if (updated) {
            this.context.success(i18n.t('Setting updated'))
        }
        this.setState({ settings: newSettings })
    }

    async componentDidMount() {
        const { d2 } = this.props

        try {
            const settings = await loadSettings(d2)
            this.setState({ state: 'loaded', settings })
        } catch (error) {
            this.setState({ state: 'error', error })
        }
    }

    getFields() {
        const { settings } = this.state

        return _([
            this.getTextField({
                name: 'email',
                label: i18n.t('Email'),
                validators: validators.email,
            }),

            this.getTextField({
                name: 'phone',
                label: i18n.t('Phone'),
                validators: validators.phone,
            }),

            this.getBooleanField({
                name: 'emailNotifications',
                label: i18n.t('Enable message email notifications'),
            }),

            this.getBooleanField({
                name: 'smsNotifications',
                label: i18n.t('Enable message SMS notifications'),
            }),

            this.getBooleanField({
                name: 'noNewsletters',
                label: i18n.t('OptOut weekly digest email'),
            }),

            this.getBooleanField({
                name: 'noMentionNotifications',
                label: i18n.t('OptOut @notification emails'),
                disabled: settings.get('emailNotifications'),
            }),
        ])
            .compact()
            .value()
    }

    getBooleanField({ name, label, disabled = false }) {
        const { settings } = this.state

        return {
            name: name,
            component: CheckBox,
            props: {
                id: "notifications-form-" + name,
                checked: settings.get(name),
                label: label,
                disabled,
                onCheck: (ev, newValue) => this.onUpdateField(name, newValue),
            },
        }
    }

    getTextField({ name, label, type, validators, disabled = false }) {
        const { settings } = this.state
        const value = settings.get(name)

        return {
            name: name,
            value:
                value !== null && value !== undefined ? value.toString() : '',
            component: TextField,
            validators,
            props: {
                id: "notifications-form-" + name,
                type: type || 'string',
                style: this.styles.textField,
                floatingLabelText: label,
                changeEvent: 'onBlur',
                disabled,
            },
        }
    }

    renderForm() {
        const { state, error } = this.state

        switch (state) {
            case 'loading':
                return <CircularProgress />
            case 'error':
                return <div>{error.message || error.toString()}</div>
            case 'loaded':
                return (
                    <div className="notifications-form">
                        <Typography gutterBottom variant="h5" component="h2">
                            {i18n.t('Notification Settings')}
                        </Typography>

                        <FormBuilder
                            fields={this.getFields()}
                            onUpdateField={this.onUpdateField}
                        />
                    </div>
                )
            default:
                throw new Error(`Unknown state: ${state}`)
        }
    }

    render() {
        return (
            <Card>
                <CardContent style={this.styles.cardContent}>
                    {this.renderForm()}
                </CardContent>
            </Card>
        )
    }
}

export default NotificationsForm
