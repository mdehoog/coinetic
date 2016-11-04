import React, {Component, PropTypes} from 'react';
import GameLoop from './GameLoop';

export default class Loop extends Component {

    static propTypes = {
        children: PropTypes.any,
        style: PropTypes.object
    };

    static childContextTypes = {
        loop: PropTypes.object
    };

    constructor(props) {
        super(props);
        this.loop = new GameLoop();
    }

    componentDidMount() {
        this.loop.start();
    }

    componentWillUnmount() {
        this.loop.stop();
    }

    getChildContext() {
        return {
            loop: this.loop,
        };
    }

    render() {
        const style = {
            height: '100%',
            width: '100%',
            ...this.props.style
        };
        return (
            <div style={style}>
                {this.props.children}
            </div>
        );
    }
}