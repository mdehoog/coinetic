import Orderbook from './Orderbook';
import Socket from './Socket';

/**
 * Product controller. Routes messages from a Socket to a number of Orderbooks for
 * each subscribed product.
 */
export default class Products {
    /**
     * Create a new Products controller.
     *
     * @param products {string[]} Products to load orderbooks for
     * @param limit {number} Order limit per side per orderbook
     * @param sampleData {boolean} Use sample data instead of live data
     */
    constructor(products, limit, sampleData) {
        this._products = products || ['BTC-USD'];
        this._limit = limit;
        this._orderbooks = {};
        this._callbacks = [];

        this._socketUrl = sampleData ? '/sample-data/socket.json' : 'wss://ws-feed.gdax.com';
        this._bookUrl = (product) => {
            return sampleData ? '/sample-data/book_' + product.toLowerCase() + '.json' :
                `https://api.exchange.coinbase.com/products/${product}/book?level=3`;
        };
        this._tickerUrl = (product) => {
            return sampleData ? '/sample-data/ticker_' + product.toLowerCase() + '.json' :
                `https://api.exchange.coinbase.com/products/${product}/ticker`;
        };
    }

    /**
     * Open the web socket feed and load the orderbooks.
     */
    open() {
        this.socket = new Socket(this._socketUrl);
        this.socket.subscribe(this._products);
        this._products.forEach((product) => {
            const orderbook = new Orderbook(product, this._limit, this._bookUrl, this._tickerUrl);
            orderbook.load();
            this._orderbooks[product] = orderbook;
            this.socket.addCallback((data) => {
                orderbook.onMessage(data);
            });
            orderbook.addCallback((product, event, data) => {
                this.onEvent(product, event, data);
            });
        });
        this._products.forEach((product) => {
            const split = product.toUpperCase().split('-');
            if (split[0] !== 'BTC' && split[1] !== 'BTC') {
                //not a BTC product, try and find a product that can be used to convert order sizes to BTC
                for (let j = 0; j < 2; j++) {
                    const match = j === 0 ? split[0] : split[1];
                    for (let i = 0; i < this._products.length; i++) {
                        const otherProduct = this._products[i];
                        const otherSplit = otherProduct.toUpperCase().split('-');
                        if ((otherSplit[0] === 'BTC' || otherSplit[1] === 'BTC') &&
                            (otherSplit[0] === match || otherSplit[1] === match)) {
                            //found one, tell the orderbook about it
                            const orderbook = this._orderbooks[product];
                            const crossOrderbook = this._orderbooks[otherProduct];
                            orderbook.setCrossConversionOrderbook(crossOrderbook);
                            return;
                        }
                    }
                }
            }
        });
    }

    /**
     * Close the socket and clear the orderbooks.
     */
    close() {
        this.socket.close();
        this._orderbooks = {};
    }

    /**
     * An orderbook event occurred.
     *
     * @param product {string} Product that the event is from
     * @param event {string} Event type
     * @param data {object} Event data
     */
    onEvent(product, event, data) {
        this._callbacks.forEach((callback) => {
            callback(product, event, data);
        });
    }

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