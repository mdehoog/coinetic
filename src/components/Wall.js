import React, {Component, PropTypes} from 'react';
import {Bodies, Composite, Body} from 'matter-js';

export default class Wall extends Component {

    static contextTypes = {
        engine: PropTypes.object
    };

    componentDidMount() {
        this.addBody();
    }

    componentWillUnmount() {
        this.removeBody();
    }

    componentWillReceiveProps(nextProps) {
        const {x, y} = nextProps;
        Body.setPosition(this.body, {
            x: x,
            y: y
        });
    }

    addBody() {
        const {x, y, width, height, label} = this.props;
        this.body = Bodies.rectangle(x, y, width, height, {
            isStatic: true,
            label: label
        });
        Composite.add(this.context.engine.world, this.body);
    }

    removeBody() {
        Composite.remove(this.context.engine.world, this.body);
        this.body = null;
    }

    render() {
        const {x, y, width, height} = this.props;
        return (
            <rect x={x - width / 2} y={y - height / 2} width={width} height={height}/>
        );
    }
}