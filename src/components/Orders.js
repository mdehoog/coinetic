import React, {Component} from 'react';
import Products from '../coinbase/Products';
import Order from './Order';
import Tooltip from './Tooltip';
import './Order.css';

export default class Orders extends Component {

    constructor(props) {
        super(...arguments);
        this.components = {};
        this.scale = 1;
        this.state = {
            orders: [],
            tooltipOrder: null,
            tooltipVisible: false
        };
        this.enabledProducts = this.arrayToObject(props.enabledProducts);
        this.disabledOrders = [];
    }

    arrayToObject(array) {
        const object = {};
        array.forEach((s) => {
            object[s] = true;
        });
        return object;
    }

    componentDidMount() {
        const sampleData = false;
        const products = this.props.products || ['BTC-USD'];
        this.unreadyProductCount = products.length;
        this.products = new Products(products, this.props.limit || 10, sampleData);
        this.products.addCallback((product, event, data) => {
            this.productEvent(product, event, data);
        });
        this.products.open();
    }

    componentWillUnmount() {
        this.products.close();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.enabledProducts !== this.props.enabledProducts) {
            this.enabledProducts = this.arrayToObject(nextProps.enabledProducts);
            const removeOrders = [];
            const addOrders = [];
            this.disabledOrders = this.removeAll(this.disabledOrders, (e) => {
                return this.enabledProducts[e.product];
            }, addOrders);
            const orders = this.removeAll(this.state.orders, (e) => {
                return !this.enabledProducts[e.product];
            }, removeOrders);
            this.disabledOrders.push.apply(this.disabledOrders, removeOrders);
            orders.push.apply(orders, addOrders);
            this.setState({
                orders: orders
            });
        }
    }

    removeAll(array, test, removed) {
        return array.filter((e) => {
            if (test(e)) {
                removed.push(e);
                return false;
            }
            return true;
        })
    }

    productEvent(product, event, data) {
        this[event](data);
    }

    //data = {product: product}
    ready() {
        this.unreadyProductCount--;
        if (this.unreadyProductCount === 0) {
            this.props.onReady();
        }
    }

    //data = {order: order}
    add(data) {
        if (!this.enabledProducts[data.order.product]) {
            this.disabledOrders.push(data.order);
            return;
        }
        const c = this.components[data.order.id];
        if (c) {
            c.cancelRemove();
        } else {
            this.setState({orders: [...this.state.orders, data.order]});
        }
    }

    //data = {order: order}
    remove(data) {
        if (!this.enabledProducts[data.order.product]) {
            const index = this.disabledOrders.indexOf(data.order);
            if (index >= 0) {
                this.disabledOrders.splice(index, 1);
            }
            return;
        }
        const c = this.components[data.order.id];
        if (c) {
            c.remove();
        }
    }

    //data = {order: order, change: num}
    change(data) {
        const c = this.components[data.order.id];
        if (c) {
            c.change(data.change);
        }
    }

    //data = {order: order, from: order, side: 'buy'|'sell', size: num, price: num}
    transfer(data) {
        const c1 = this.components[data.order.id];
        const c2 = this.components[data.from.id];
        if (c1 && c2) {
            c1.transfer(c2, data.price, data.size, data.side);
        }
    }

    componentAdded(order, component) {
        this.components[order.id] = component;
    }

    removeComponent(order) {
        const state = {orders: this.state.orders.filter((o) => o !== order)};
        if (this.state.tooltipOrder === order) {
            state.tooltipVisible = false;
        }
        this.setState(state);
    }

    onTooltip(order, show) {
        const state = {};
        if (show) {
            state.tooltipVisible = true;
            if (this.state.tooltipOrder !== order) {
                state.tooltipOrder = order;
            }
        } else if (this.state.tooltipOrder === order) {
            state.tooltipVisible = false;
        }
        this.setState(state);
    }

    onMove(order, body) {
        if (this.tooltip && order === this.state.tooltipOrder) {
            const {width, height} = this.props;
            this.tooltip.move(body, width, height);
        }
    }

    radius(size, order) {
        size *= order.book.getSizeInBTCMultiplier() * 1000;
        return Math.max(8, Math.log(1 + Math.max(0, size)) * this.scale);
    }

    render() {
        const {width, height, border} = this.props;
        const {orders, tooltipOrder, tooltipVisible} = this.state;
        const area = (width - border) * (height - border);
        let orderArea = 0;

        this.scale = 1;
        this.state.orders.forEach((order) => {
            const radius = this.radius(order.size, order);
            orderArea += radius * radius;
        });
        this.scale = Math.sqrt(area / (orderArea * 4));

        this.components = {};
        const renderOrder = (order) => {
            return (
                <Order key={order.id} order={order} width={width} height={height}
                       radius={(size, order) => {
                           return this.radius(size, order);
                       }}
                       ref={(c) => this.componentAdded(order, c)}
                       onRemove={(c) => this.removeComponent(order)}
                       onTooltip={(c, show) => this.onTooltip(order, show)}
                       onMove={(body) => this.onMove(order, body)}/>
            );
        };
        const orderChildren = orders.map((order) => {
            return order === tooltipOrder ? null : renderOrder(order);
        });
        if (tooltipOrder) {
            orderChildren.push(renderOrder(tooltipOrder));
        }

        return (
            <g>
                {orderChildren}
                <Tooltip order={tooltipOrder} visible={tooltipVisible}
                         ref={(tooltip) => this.tooltip = tooltip}/>
            </g>
        );
    }
}