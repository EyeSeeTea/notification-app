import React, { Component } from 'react'
import PropTypes from 'prop-types'
import NotificationsForm from './components/NotificationsForm'

class Root extends Component {
    static propTypes = {
        d2: PropTypes.object.isRequired,
    }

    render() {
        const { d2 } = this.props

        return (
            <React.Fragment>
                <NotificationsForm d2={d2} />
            </React.Fragment>
        )
    }
}

export default Root
