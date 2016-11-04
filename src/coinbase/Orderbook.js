import 'whatwg-fetch';
import num from 'num';
import Order from './Order';
import LimitedRBTree from '../utils/LimitedRBTree';

/**
 * Represents a Coinbase orderbook for a particular product.
 */
export default class Orderbook {
    /**
     * Create an orderbook.
     *
     * @param product {string} Orderbook product
     * @param limit {number} Maximum number of open orders to track on both the bid and ask sides
     * @param url {string} Orderbook URL
     * @param tickerUrl {string|function} Product ticker URL
     */
    constructor(product, limit, url, tickerUrl) {
        product = product.toUpperCase();
        if (typeof url === 'function') {
            url = url(product);
        }
        if (typeof tickerUrl === 'function') {
            tickerUrl = tickerUrl(product);
        }
        this._product = product;
        this._limit = limit;
        this._url = url;
        this._tickerUrl = tickerUrl;
        this._addDelay = 2000;
        this._addTimers = {};
        this._callbacks = [];
        this._price = num(1);
        this._isSizeBTC = this._product.indexOf('BTC') === 0;
        this.clear();
    }

    /**
     * Remove all orders from this orderbook.
     */
    clear() {
        this._unopen = {};
        this._open = {};
        this._sequence = -1;
        this._queue = [];
        this._number = 0;

        const comparator = (reverse) => {
            return (a, b) => {
                //sort all equal price orders in insertion order
                if (a.price.eq(b.price)) {
                    return a.number - b.number;
                }
                return reverse ? b.price.cmp(a.price) : a.price.cmp(b.price);
            };
        };
        this._bids = new LimitedRBTree(this._limit, comparator(true));
        this._asks = new LimitedRBTree(this._limit, comparator(false));
        this._bidsMinMax = {min: null, max: null};
        this._asksMinMax = {min: null, max: null};
    }

    /**
     * Calculate a multiplier that can be used to convert order sizes to BTC.
     * If one of this orderbook's product sides is not BTC, it uses the current
     * price of a cross-conversion orderbook as a multiplier.
     *
     * @returns {number} Multiplier that can be used to convert order sizes to BTC
     *
     * @see setCrossConversionOrderbook
     */
    getSizeInBTCMultiplier() {
        switch (this._crossConversionOrderbookType) {
            case 1:
                return +this._crossConversionOrderbook.getPrice();
            case 2:
                return 1 / this._crossConversionOrderbook.getPrice();
            case 3:
                return this.getPrice() * this._crossConversionOrderbook.getPrice();
            case 4:
                return this.getPrice() / this._crossConversionOrderbook.getPrice();
            default:
                return this._isSizeBTC ? 1 : +this.getPrice();
        }
    }

    /**
     * Set the orderbook that can be used to convert order sizes to BTC.
     * One side of the orderbook provided must match one side of this orderbook,
     * and the other side must be BTC.
     *
     * @param orderbook {Orderbook} Orderbook who's price can be used to convert order sizes to BTC.
     *
     * @see getSizeInBTCMultiplier
     */
    setCrossConversionOrderbook(orderbook) {
        this._crossConversionOrderbook = orderbook;
        const split1 = this._product.split('-');
        const split2 = orderbook._product.split('-');
        this._crossConversionOrderbookType =
            split1[0] === split2[0] ? 1 :
                split1[0] === split2[1] ? 2 :
                    split1[1] === split2[0] ? 3 :
                        split1[1] === split2[1] ? 4 : 0;
    }

    /**
     * @returns {num} Last match price
     */
    getPrice() {
        return this._price;
    }

    /**
     * Calculate the competitiveness of the given order. This is a number that
     * represents where the given order's ask/bid price lies in the currently open
     * orders, 0 being equal to the lowest-ask/highest-bid price, 1 being equal to
     * the highest-ask/lowest-bid price. Lower numbers will match first.
     *
     * @param order {object} Order to check competitiveness
     * @returns {number} Competitiveness of the given order
     */
    getCompetitiveness(order) {
        const minmax = this.getSortedTreeMinMax(order.side);
        if (!minmax.min || !minmax.max) {
            return 0;
        }
        const range = minmax.max.price - minmax.min.price;
        if (!range) {
            return 0;
        }
        const p = (order.price - minmax.min.price) / range;
        return p;
    }

    /**
     * Load the orderbook from the API and populate this object's orders.
     */
    load() {
        if (this._fetching) {
            return;
        }
        this.clear();
        this._fetching = true;
        this._sequence = -1;
        fetch(this._tickerUrl).then((response) => {
            return response.text();
        }).then((ticker) => {
            ticker = JSON.parse(ticker);
            this._price = num(ticker.price);
            return fetch(this._url);
        }).then((response) => {
            return response.text();
        }).then((book) => {
            book = JSON.parse(book);
            this._fetching = false;
            this.onLoaded(book);
        }).catch((e) => {
            console.log(e);
            this._fetching = false;
            setTimeout(() => {
                this.load(); //retry fetch
            }, 10000);
        });
    }

    /**
     * Called by the load function when the orderbook has been loaded.
     *
     * @param book {object} Data loaded from the API
     *
     * @see load
     */
    onLoaded(book) {
        const queue = this._queue;
        this.clear();
        this._sequence = book.sequence;
        for (let i = 0; i < 2; i++) {
            const orders = i === 0 ? book.bids : book.asks;
            const side = i === 0 ? 'buy' : 'sell';
            orders.forEach((order) => {
                order = {
                    order_id: order[2],
                    side: side,
                    price: order[0],
                    size: order[1]
                };
                this.received(order);
                this.open(order, true);
            });
        }
        queue.forEach((data) => {
            this.onMessage(data);
        });
        this.ready();
    }

    /**
     * Message has been received from the live web socket feed.
     *
     * @param data {object} Data received from the websocket
     */
    onMessage(data) {
        if (data.product_id !== this._product) {
            //message is not for this product
            return;
        }
        if (this._sequence === -1) {
            //not yet seeded, so queue messages
            this._queue.push(data);
            return;
        }
        if (data.sequence !== this._sequence + 1) {
            if (data.sequence > this._sequence) {
                //out of sequence, fetch the order book again
                this.load();
            }
            return;
        }
        if (typeof this[data.type] === 'function') {
            this[data.type](data);
        }
        this._sequence = data.sequence;
    }

    /**
     * Order has been received.
     *
     * @param data {object} Order data
     */
    received(data) {
        const order = new Order(data, this);
        this._unopen[order.id] = order;
    }

    /**
     * Order has been marked as open. The order is added to the open order tree after a
     * delay.
     *
     * @param data {object} Order data
     * @param immediately {boolean} Add to the open order tree immediately without delay
     */
    open(data, immediately) {
        const order = this._unopen[data.order_id];
        if (!order) {
            return;
        }
        delete this._unopen[order.id];
        this._open[order.id] = order;
        order.open = true;
        order.number = this._number++;
        this.addToTree(order, immediately);
        this.processMatches(order);
        if (data.remaining_size && !order.size.eq(data.remaining_size)) {
            const size = order.size;
            order.size = num(data.remaining_size);
            this.changed(order, size.sub(order.size));
        }
    }

    /**
     * A match between two orders has occurred.
     *
     * @param data {object} Match data
     */
    match(data) {
        const taker = this._unopen[data.taker_order_id];
        const maker = this._open[data.maker_order_id];
        if (!taker || !maker) {
            return;
        }
        const size = num(data.size);
        const price = num(data.price);
        taker.makers.push({
            maker: maker,
            size: size,
            price: price
        });
        maker.takers.push(taker);
        this._price = price;
    }

    /**
     * An order size has decreased.
     *
     * @param data {object} Order data
     */
    change(data) {
        const order = this._open[data.order_id];
        if (!order) {
            return;
        }
        const size = order.size;
        order.size = num(data.new_size);
        if (!order.size.eq(size)) {
            this.changed(order, size.sub(order.size));
        }
    }

    /**
     * An order is done (either fulfilled or canceled).
     *
     * @param data {object} Order data
     */
    done(data) {
        const order = this._open[data.order_id] || this._unopen[data.order_id];
        if (!order) {
            return;
        }
        order.done = true;
        if (order.open) {
            delete this._open[order.id];
            this.processMatches(order);
            if (!order.takers.length) {
                this.removeFromTree(order);
            }
        } else {
            //non-open order, calculate average price if market order
            delete this._unopen[order.id];
            if (order.makers.length > 0) {
                let size = num(0), price = num(0);
                order.makers.forEach((match) => {
                    size = match.size.add(size);
                    price = match.price.mul(match.size).add(price);
                });
                order.price = order.price || price.div(size);
                order.size = order.size || size;
                this.added(order);
                this.processMatches(order);
                this.removed(order);
            }
        }
    }

    /**
     * Process matches for the given taker order.
     *
     * @param taker {Order} Order to process matches
     */
    processMatches(taker) {
        taker.makers.forEach((match) => {
            const from = taker.side === 'sell' ? taker : match.maker;
            const to = taker.side === 'sell' ? match.maker : taker;
            this.transferred(to, from, match.size, match.price, taker.side);
            to.size = to.size.sub(match.size);
            from.size = from.size.sub(match.size);
        });
        taker.makers.forEach((match) => {
            const maker = match.maker;
            maker.takers.splice(maker.takers.indexOf(taker), 1);
            if (!maker.open) {
                this.removed(maker);
            } else if (!maker.takers.length && maker.done) {
                this.removeFromTree(maker);
            }
        });
        taker.makers = [];
    }

    /**
     * Get the RB-tree for the given order side.
     *
     * @param side {string} 'buy' or 'sell'
     * @returns {LimitedRBTree} Tree for the given side
     */
    getSortedTree(side) {
        return side === 'buy' ? this._bids : this._asks;
    }

    /**
     * @typedef {Object} MinMax
     * @property {Order} min - Minimum order
     * @property {Order} max - Maximum order
     */
    /**
     * Get the min/max orders for the given order side.
     *
     * @param side {string} 'buy' or 'sell'
     * @returns {MinMax} Min/Max order on the given side.
     */
    getSortedTreeMinMax(side) {
        return side === 'buy' ? this._bidsMinMax : this._asksMinMax;
    }

    /**
     * Add the given order to the RB-tree after a delay.
     *
     * @param order {Order} order to add
     * @param immediately {boolean} Add the order immediately without a delay
     */
    addToTree(order, immediately) {
        if (immediately) {
            const tree = this.getSortedTree(order.side);
            const minMax = this.getSortedTreeMinMax(order.side);
            this.handleTreeResult(tree, tree.insert(order), minMax);
            return;
        }
        clearTimeout(this._addTimers[order.id]);
        this._addTimers[order.id] = setTimeout(() => {
            this.addToTreeIfWaiting(order);
        }, this._addDelay);
    }

    /**
     * Add the given order to the RB-tree if it has been delayed in being added.
     *
     * @param order {Order} order to add
     *
     * @see addToTree
     */
    addToTreeIfWaiting(order) {
        const timer = this._addTimers[order.id];
        if (timer) {
            clearTimeout(timer);
            delete this._addTimers[order.id];
            const tree = this.getSortedTree(order.side);
            const minMax = this.getSortedTreeMinMax(order.side);
            this.handleTreeResult(tree, tree.insert(order), minMax);
        }
    }

    /**
     * Remove the given order from the RB-tree.
     *
     * @param order {Order} order to remove
     */
    removeFromTree(order) {
        const timer = this._addTimers[order.id];
        if (timer) {
            clearTimeout(timer);
            delete this._addTimers[order.id];
        } else {
            const tree = this.getSortedTree(order.side);
            const minMax = this.getSortedTreeMinMax(order.side);
            this.handleTreeResult(tree, tree.remove(order), minMax);
        }
    }

    /**
     * Handle a LimitedRBTree insert/remove return value.
     *
     * @param tree {LimitedRBTree} Tree that had an order inserted/removed
     * @param result {LimitedRBTreeResult} Tree insertion/removal result
     * @param minMax {MinMax} MinMax for the given tree
     */
    handleTreeResult(tree, result, minMax) {
        if (!(result.out || result.in)) {
            return;
        }
        minMax.min = tree.min();
        minMax.max = tree.limitedMax();
        if (result.out) {
            this.removed(result.out);
        }
        if (result.in) {
            this.added(result.in);
        }
    }

    /**
     * Notify that this orderbook is ready.
     */
    ready() {
        this.raise('ready', {product: this._product});
    }

    /**
     * Notify the order was added.
     *
     * @param order {Order} Added order
     */
    added(order) {
        this.raise('add', {order: order});
    }

    /**
     * Notify the order was removed.
     *
     * @param order {Order} Removed order
     */
    removed(order) {
        this.raise('remove', {order: order});
    }

    /**
     * Notify the order was changed.
     *
     * @param order {Order} Changed order
     * @param change {num} Size removed from order
     */
    changed(order, change) {
        this.addToTreeIfWaiting(order);
        this.raise('change', {order: order, change: change});
    }

    /**
     * Notify that a match occurred.
     *
     * @param to {Order} Order receiving the currency
     * @param from {Order} Order transferring the currency
     * @param size {num} Amount of currency transferred
     * @param price {num} Ask/bid price
     * @param side {string} 'buy' or 'sell'
     */
    transferred(to, from, size, price, side) {
        this.addToTreeIfWaiting(to);
        this.addToTreeIfWaiting(from);
        this.raise('transfer', {order: to, from: from, size: size, price: price, side: side});
    }

    /**
     * Raise the given event to the listeners.
     *
     * @param event {string} Event to raise
     * @param data {object} Data to send
     */
    raise(event, data) {
        this._callbacks.forEach((callback) => {
            callback(this._product, event, data);
        });
    }

    /**
     * Event callback for Orderbook events.
     *
     * @callback orderbookCallback
     * @param {string} product
     * @param {string} event
     * @param {object} data
     */

    /**
     * Add a callback listening to order events.
     *
     * @param callback {orderbookCallback} Callback to add
     */
    addCallback(callback) {
        this._callbacks.push(callback);
    }

    /**
     * Remove a callback.
     *
     * @param callback {orderbookCallback} Callback to remove
     */
    removeCallback(callback) {
        this._callbacks.splice(this._callbacks.indexOf(callback), 1);
    }
}