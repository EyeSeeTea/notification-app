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
        cardContent: { width: 800, marginLeft: 10, marginTop: 5 },
        textField: { width: '100%' },
        title: { fontWeight: 'bold', marginBottom: 0 },
        subtitle2: { fontWeight: 'bold' },
        subtitle1: { fontWeight: 'bold', marginTop: '30px' },
    }

    state = {
        state: 'loading',
        settings: null,
        error: null,
    }

    onUpdateField = async (fieldName, newValue) => {
        const { settings } = this.state
        const { error, updated, settings: newSettings } = await settings.set(
            fieldName,
            newValue
        )

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

    getFirstSectionFields() {
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
        ])
            .compact()
            .value()
    }

    getLastSectionFields() {
        const { settings } = this.state

        return _([
            this.getBooleanField({
                name: 'emailNotifications',
                label: (
                    <div>
                        <Typography
                            gutterBottom
                            variant="subtitle2"
                            style={this.styles.subtitle2}
                        >
                            {i18n.t('Enable email forwarding (All)')}
                        </Typography>
                        <Typography gutterBottom variant="body2">
                            {i18n.t(
                                'You will receive a copy of ALL messages sent to your DHIS inbox. This includes mentions, new interpretations and comments to subcribed objects, system notification, validation notifications, etc.'
                            )}
                        </Typography>
                    </div>
                ),
            }),

            this.getBooleanField({
                name: 'smsNotifications',
                label: (
                    <div>
                        <Typography
                            gutterBottom
                            variant="subtitle2"
                            style={this.styles.subtitle2}
                        >
                            {i18n.t('Enable SMS forwarding (All)')}
                        </Typography>
                        <Typography gutterBottom variant="body2">
                            {i18n.t(
                                'You will receive a SMS notification for ALL messages sent to your DHIS inbox. This includes mentions, new interpretations and comments to subcribed objects, system notification, validation notifications, etc.'
                            )}
                        </Typography>
                    </div>
                ),
            }),

            this.getBooleanField({
                name: 'noMentionNotifications',
                label: (
                    <div>
                        <Typography
                            gutterBottom
                            variant="subtitle2"
                            style={this.styles.subtitle2}
                        >
                            {i18n.t('Opt-Out of @mention email notifications')}
                        </Typography>
                        <Typography gutterBottom variant="body2">
                            {i18n.t(
                                'We will not forward direct @mentions to your inbox'
                            )}
                        </Typography>
                    </div>
                ),
                disabled: settings.get('emailNotifications'),
            }),

            this.getBooleanField({
                name: 'noNewsletters',
                label: (
                    <div>
                        <Typography
                            gutterBottom
                            variant="subtitle2"
                            style={this.styles.subtitle2}
                        >
                            {i18n.t('Opt-Out of Weekly digest email')}
                        </Typography>
                        <Typography gutterBottom variant="body2">
                            {i18n.t(
                                'By Default, all users receive a weekly digest for all favorites that they have subscribed to. You can opt-out from receiving  this weekly digest'
                            )}
                        </Typography>
                    </div>
                ),
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
                id: 'notifications-form-' + name,
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
                id: 'notifications-form-' + name,
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
                        <Typography
                            gutterBottom
                            variant="h5"
                            component="h2"
                            style={this.styles.title}
                        >
                            {i18n.t('PSI Notification Settings app')}
                        </Typography>

                        <FormBuilder
                            fields={this.getFirstSectionFields()}
                            onUpdateField={this.onUpdateField}
                        />
                        <Typography
                            gutterBottom
                            variant="h6"
                            component="h3"
                            style={this.styles.subtitle1}
                        >
                            {i18n.t('DHIS Message forwarding')}
                        </Typography>
                        <Typography gutterBottom variant="subtitle1">
                            {i18n.t(
                                'DHIS can forward some or all of the messages that are sent to your '
                            )}
                            <a href="/dhis-web-messaging">
                                {i18n.t('DHIS messages inbox')}
                            </a>
                        </Typography>
                        <FormBuilder
                            fields={this.getLastSectionFields()}
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
