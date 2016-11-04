import React, {Component, PropTypes} from 'react';
import {Events, Body, Composite, Bodies} from 'matter-js';
import TinyAnimate from 'TinyAnimate';

const strokeColors = {
    btc: '#FF9900',
    usd: '#216C2A',
    eth: '#4d8ee9',
    ltc: '#404040',
    gbp: '#C60C30',
    eur: '#003399'
};

export default class Orders extends Component {

    static contextTypes = {
        loop: PropTypes.object,
        engine: PropTypes.object
    };

    constructor(props) {
        super(...arguments);
        this.transfers = {};
        this.circleAttributes = {};
        this.size = props.order.size;
        this.visible = true;
    }

    componentDidMount() {
        this.addBody();
        this.loopId = this.context.loop.subscribe(this.loop);
    }

    componentWillUnmount() {
        this.context.loop.unsubscribe(this.loopId);
        TinyAnimate.cancel(this.rAnimation);
        this.removeBody();
    }

    loop = () => {
        if (!this.circle || !this.body) {
            return;
        }
        const {order, width, onMove} = this.props;
        const buy = order.side === 'buy';
        const {x, y} = this.body.position;
        let {angle} = this.body;
        angle *= 180 / Math.PI;
        const radius = this.radius();
        const strokeWidth = radius * 0.1;
        const r = this.visible ? Math.max(1, radius - strokeWidth * 0.5 - 2) : 0;
        let opacity = Math.max(0, Math.min(1, 1 - order.book.getCompetitiveness(order)));
        opacity = 0.5 * opacity + 0.5;
        this.body.gravity.x = this.visible ? (buy ? 0 : width) : null;

        this.updateAttribute('stroke-width', strokeWidth, 1);
        this.updateAttribute('opacity', opacity, 1);

        if (this.isUpdateAttributeRequired('x', x, 1) || this.isUpdateAttributeRequired('y', y, 1) || this.isUpdateAttributeRequired('angle', angle, 0)) {
            this.group.setAttribute('transform', `translate(${x} ${y}) rotate(${angle})`);
        }

        if (this.isUpdateAttributeRequired('r', r, 0)) {
            TinyAnimate.cancel(this.rAnimation);
            this.rAnimation = TinyAnimate.animate(+this.circle.getAttribute('r'), r, 500, (x) => {
                this.circle.setAttribute('r', '' + Math.max(0, x));
            });
        }

        if (this.body.radius.toFixed(0) !== radius.toFixed(0)) {
            const bodyScale = radius / (this.body.radius || 1);
            Body.scale(this.body, bodyScale, bodyScale);
            this.body.radius = radius;
        }

        onMove(this.body);
    };

    updateAttribute(key, value, decimalPlaces) {
        if (this.isUpdateAttributeRequired(key, value, decimalPlaces)) {
            this.circle.setAttribute(key, value);
        }
    }

    isUpdateAttributeRequired(key, value, decimalPlaces) {
        const oldValue = this.circleAttributes[key];
        if (oldValue === undefined || oldValue.toFixed(decimalPlaces) !== value.toFixed(decimalPlaces)) {
            this.circleAttributes[key] = value;
            return true;
        }
        return false;
    }

    remove() {
        this.removePending = true;
        if (!this.body.gravity.attractors.length) {
            this.removeNow();
        }
    }

    removeNow() {
        this.visible = false;
        this.removeTimer = setTimeout(() => {
            this.props.onRemove(this);
        }, 500);
    }

    cancelRemove() {
        this.removePending = false;
        this.visible = true;
        clearTimeout(this.removeTimer);
    }

    change(change) {
        this.size = this.size.sub(change);
        this.body.orderSize = this.size;
    }

    transfer(other, price, size, side) {
        //side = taker side (if side = order.side, then this is the taker)
        this.transfers[other.body.label] = {
            other: other,
            size: size
        };

        this.transferStart(other);
        other.transferStart(this);
    }

    transferStart(other) {
        const attractors = this.body.gravity.attractors;
        if (!attractors.length) {
            Body.setDensity(this.body, 0.1);
            this.body.frictionAir = 0.02;
        }
        attractors.push(other.body);
        if (this.removePending) {
            this.cancelRemove();
            this.remove();
        }
    }

    transferComplete(other, size) {
        const attractors = this.body.gravity.attractors;
        attractors.splice(attractors.indexOf(other.body), 1);
        if (!attractors.length) {
            Body.setDensity(this.body, 0.001);
            this.body.frictionAir = 0.01;
            if (this.removePending) {
                this.removeNow();
            }
        }
        if (attractors.length || !this.removePending) {
            this.change(size);
        }
    }

    addBody() {
        const {width, height, order} = this.props;
        const buy = order.side === 'buy';
        const radius = this.radius();
        let x = Math.random() * 50 + radius;
        x = buy ? x : width - x;
        const y = 20 + Math.random() * (height - 40);
        const gravity = {x: null, y: null, attractors: []};
        gravity.x = this.visible ? (buy ? 0 : width) : null;

        this.body = Bodies.polygon(x, y, 8, radius, {
            gravity: gravity,
            restitution: 0.3,
            friction: 0,
            frictionStatic: 0,
            frictionAir: 0.01,
            radius: radius,
            label: order.id,
            order: order,
            orderSize: this.size
        });
        Composite.add(this.context.engine.world, this.body);

        Events.on(this.body, 'attractorCollision', (e) => {
            const transfer = this.transfers[e.body.label];
            if (transfer) {
                delete this.transfers[e.body.label];
                this.transferComplete(transfer.other, transfer.size);
                transfer.other.transferComplete(this, transfer.size);
            }
        });
    }

    removeBody() {
        Composite.remove(this.context.engine.world, this.body);
        this.body = null;
    }

    radius() {
        const {order, radius} = this.props;
        return radius(this.size, order);
    }

    onMouseEnter() {
        const {onTooltip} = this.props;
        onTooltip(this, true);
    }

    onMouseLeave() {
        const {onTooltip} = this.props;
        onTooltip(this, false);
    }

    render() {
        const {order} = this.props;
        const product = order.product.toLowerCase();
        const className = 'order ' + product + '-' + order.side;
        const styling = this.constructor.circleStyling(order);
        return (
            <g id={order.id} className={className} stroke={styling.stroke} fill={styling.fill}
               ref={(group) => this.group = group}
               onMouseEnter={() => this.onMouseEnter()}
               onMouseLeave={() => this.onMouseLeave()}>
                <circle cx={0} cy={0} r={0}
                        ref={(circle) => this.circle = circle}/>
            </g>
        );
    }

    static circleStyling(order) {
        const buy = order.side === 'buy';
        const split = order.product.toLowerCase().split('-');
        return {
            fill: 'url(#' + (buy ? split[1] : split[0]) + ')',
            stroke: strokeColors[buy ? split[0] : split[1]]
        };
    }
}