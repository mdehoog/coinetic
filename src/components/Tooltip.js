import React, {Component} from 'react';
import Order from './Order';
import './Tooltip.css';

export default class Tooltip extends Component {

    componentDidMount() {
        this.sizeCircle();
    }

    componentDidUpdate() {
        this.sizeCircle();
    }

    sizeCircle() {
        const bbox = this.text.getBBox();
        const padding = 10;
        const r = Math.max(bbox.width, bbox.height) / 2 + padding;
        const strokeWidth = r * 0.1;
        this.circle.setAttribute('r', '' + r);
        this.circle.setAttribute('stroke-width', '' + strokeWidth);
    }

    move(body, width, height) {
        let {x, y} = body.position;
        let {angle} = body;
        angle *= 180 / Math.PI;
        const r = +this.circle.getAttribute('r');
        x = Math.max(r, Math.min(width - r, x));
        y = Math.max(r, Math.min(height - r, y));
        this.group.setAttribute('transform', `translate(${x} ${y})`);
        this.circle.setAttribute('transform', `rotate(${angle})`);
    }

    render() {
        const {order, visible} = this.props;
        let className = 'tooltip ' + (visible ? ' visible' : '');
        let line1, line2, line3, line4;
        let styling = {};
        if (order) {
            const split = order.product.split('-');
            const buy = order.side === 'buy';
            const size = (+order.size) + ' ' + split[0];
            const amount = (+order.size.mul(order.price)) + ' ' + split[1];
            line1 = 'has';
            line2 = buy ? amount : size;
            line3 = 'wants';
            line4 = buy ? size : amount;
            className += ' order ' + order.product.toLowerCase() + '-' + order.side;
            styling = Order.circleStyling(order);
        }

        return (
            <g className={className}
               ref={(group) => this.group = group}>
                <g>
                    <circle cx="0" cy="0" r="0" stroke={styling.stroke} fill={styling.fill}
                            ref={(circle) => this.circle = circle}/>
                    <text fontSize="12" className="outlined"
                          ref={(text) => this.text = text}>
                        <tspan x="0" y="-19" textAnchor="middle">
                            {line1}
                        </tspan>
                        <tspan x="0" dy="15" textAnchor="middle" className="bold">
                            {line2}
                        </tspan>
                        <tspan x="0" dy="15" textAnchor="middle">
                            {line3}
                        </tspan>
                        <tspan x="0" dy="15" textAnchor="middle" className="bold">
                            {line4}
                        </tspan>
                    </text>
                </g>
            </g>
        );
    }
}