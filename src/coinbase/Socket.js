/**
 * Loads the WebSocket product feed.
 */
export default class Socket {
    /**
     * Create a new Socket.
     *
     * @param url {string|function} Web socket url
     */
    constructor(url) {
        if (typeof url === 'function') {
            url = url();
        }
        this._url = url;
        this._callbacks = [];
    }

    /**
     * Open and subscribe the websocket using the given products.
     *
     * @param products {string[]} Products to subscribe to
     */
    subscribe(products) {
        if (this._url.indexOf('ws://') === 0 ||
            this._url.indexOf('wss://') === 0) {
            products = (products || []).slice(); //take a copy to be safe
            if (this._ws) {
                this.close();
            }
            this._ws = new WebSocket(this._url);
            this._ws.onopen = () => {
                this._ws.send(JSON.stringify({
                    type: 'subscribe',
                    product_ids: products
                }));
            };
            this._ws.onclose = () => {
                this._ws = null;
                //attempt reconnect
                setTimeout(() => {
                    if (!this._ws) {
                        this.subscribe(products);
                    }
                }, 5000);
            };
            this._ws.onmessage = (e) => {
                this.onReceived(JSON.parse(e.data));
            };
        } else {
            //not a web socket URL, so just fetch the URL and send messages using setTimeout
            fetch(this._url).then((response) => {
                return response.text();
            }).then((body) => {
                body = JSON.parse(body);
                const emulateOnMessage = () => {
                    if (body.length === 0) {
                        return;
                    }
                    const data = body.splice(0, 1)[0];
                    this.onReceived(data);

                    const nextData = body[0];
                    if (!nextData) {
                        return;
                    }
                    const current = Date.parse(data.time);
                    const next = Date.parse(nextData.time);
                    setTimeout(emulateOnMessage, next - current);
                };
                emulateOnMessage();
            });
        }
    }

    /**
     * Close the web socket.
     */
    close() {
        if (!this._ws) {
            return;
        }
        this._ws.onclose = null;
        this._ws.close();
        this._ws = null;
    }

    /**
     * Web socket data received.
     *
     * @param data {object} Data received
     */
    onReceived(data) {
        this._callbacks.forEach((callback) => {
            callback(data);
        });
    }

    /**
     * Event callback for Socket events.
     *
     * @callback socketCallback
     * @param {object} data
     */

    /**
     * Add a callback listening to order events.
     *
     * @param callback {socketCallback} Callback to add
     */
    addCallback(callback) {
        this._callbacks.push(callback);
    }

    /**
     * Remove a callback.
     *
     * @param callback {socketCallback} Callback to remove
     */
    removeCallback(callback) {
        this._callbacks.splice(this._callbacks.indexOf(callback), 1);
    }
}