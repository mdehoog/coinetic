import React, {Component} from 'react';
import './Fader.css';

export default class Fader extends Component {

    constructor() {
        super(...arguments);
        this.state = {
            hidden: false
        };
    }

    componentDidMount() {
        document.addEventListener('mousemove', this.onMouse);
        document.addEventListener('mousedown', this.onMouse);
        this.show();
    }

    componentWillUnmount() {
        document.removeEventListener('mousemove', this.onMouse);
        document.removeEventListener('mousedown', this.onMouse);
    }

    onMouse = () => {
        this.show();
    };

    show() {
        this.setState({
            hidden: false
        });
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.hide(), this.props.delay || 3000);
    }

    hide() {
        this.setState({
            hidden: true
        });
    }

    render() {
        const {children} = this.props;
        const {hidden} = this.state;
        return (
            <div className={'fader ' + (hidden ? 'hidden' : '')}>
                {children}
            </div>
        );
    }
}