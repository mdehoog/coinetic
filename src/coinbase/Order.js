import num from 'num';

/**
 * Represents an order on the orderbook.
 *
 * @property {string} id - Unique order id
 * @property {string} side - Order side ('buy'/'sell)
 * @property {Order[]} makers - Array of matched makers for which this order is a taker
 * @property {Order[]} takers - Array of matched takers for which this order is a maker
 * @property {boolean} done - Order is done
 * @property {boolean} open - Order is open
 * @property {boolean} market - Order is a market order
 * @property {string} product - Product this order is from
 * @property {Orderbook} book - Orderbook this order is from
 * @property {num} size - Order size
 * @property {num} price - Order price
 * @property {number} number - Unique incrementing number assigned to this order (if open)
 */
export default class Order {
    /**
     * Create a new order.
     * @param data {object} Order data
     * @param book {Orderbook} Orderbook
     */
    constructor(data, book) {
        this.id = data.order_id;
        this.side = data.side;
        this.makers = [];
        this.takers = [];
        this.done = false;
        this.open = false;
        this.market = data.order_type === 'market';
        this.product = book._product;
        this.book = book;
        this.number = -1;
        if (data.price) {
            this.price = num(data.price);
        }
        if (data.size) {
            this.size = num(data.size);
        }
    }
}