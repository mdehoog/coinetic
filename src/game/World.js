import React, {Component, PropTypes} from 'react';

import Matter, {Engine, Events} from 'matter-js';

export default class World extends Component {

    static propTypes = {
        children: PropTypes.any,
        bounds: PropTypes.shape({
            min: PropTypes.shape({
                x: PropTypes.number,
                y: PropTypes.number
            }),
            max: PropTypes.shape({
                x: PropTypes.number,
                y: PropTypes.number
            })
        }),
        onCollision: PropTypes.func
    };

    static defaultProps = {
        bounds: {
            min: {x: -Infinity, y: -Infinity},
            max: {x: Infinity, y: Infinity},
        },
        onCollision: () => {
        }
    };

    static contextTypes = {
        loop: PropTypes.object,
    };

    static childContextTypes = {
        engine: PropTypes.object,
    };

    constructor(props) {
        super(...arguments);
        const {bounds} = props;
        const world = Matter.World.create({bounds: bounds, gravity: {x: 0, y: 0}});
        this.engine = Engine.create({world: world});
    }

    componentWillReceiveProps(nextProps) {
        const {bounds} = nextProps;
        if (bounds !== this.props.bounds) {
            this.engine.world.bounds = bounds;
        }
    }

    componentDidMount() {
        this.loopId = this.context.loop.subscribe(this.loop);
        Events.on(this.engine, 'collisionStart', this.props.onCollision);
    }

    componentWillUnmount() {
        this.context.loop.unsubscribe(this.loopId);
        Events.off(this.engine, 'collisionStart', this.props.onCollision);
    }

    getChildContext() {
        return {
            engine: this.engine,
        };
    }

    loop = () => {
        const time = Date.now();
        const delta = Math.min(20, time - (this.lastTime || time));
        const correction = delta / (this.lastDelta || delta);
        Engine.update(this.engine, delta, correction);
        this.lastTime = time;
        this.lastDelta = delta;
    };

    render() {
        const style = {
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
        };
        return (
            <div style={style}>
                {this.props.children}
            </div>
        );
    }
}