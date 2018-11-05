import React, { Component } from 'react'
import snackbarContext from './context'
import SnackbarConsumer from './SnackbarConsumer.component'

export default class SnackbarProvider extends Component {
    constructor(props) {
        super(props)

        this.state = {
            isOpen: false,
            message: '',
            variant: 'success',
        }
    }

    success = message => {
        this.openSnackbar(message, 'success')
    }

    info = message => {
        this.openSnackbar(message, 'info')
    }

    warning = message => {
        this.openSnackbar(message, 'warning')
    }

    error = message => {
        this.openSnackbar(message, 'error')
    }

    openSnackbar = (message, variant) => {
        this.setState({
            message,
            isOpen: true,
            variant,
        })
    }

    closeSnackbar = () => {
        this.setState({
            message: '',
            isOpen: false,
        })
    }

    render() {
        const { children } = this.props

        const value = {
            closeSnackbar: this.closeSnackbar,
            success: this.success,
            info: this.info,
            warning: this.warning,
            error: this.error,
            snackbarIsOpen: this.state.isOpen,
            message: this.state.message,
            variant: this.state.variant,
        }

        return (
            <snackbarContext.Provider value={value}>
                <SnackbarConsumer />
                {children}
            </snackbarContext.Provider>
        )
    }
}
