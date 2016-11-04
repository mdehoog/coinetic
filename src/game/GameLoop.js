export default class GameLoop {
    constructor() {
        this.subscribers = [];
        this.loopID = null;
    }

    start() {
        if (!this.loopID) {
            this.loop();
        }
    }

    stop() {
        window.cancelAnimationFrame(this.loopID);
    }

    subscribe(callback) {
        return this.subscribers.push(callback);
    }

    unsubscribe(id) {
        delete this.subscribers[id - 1];
    }

    loop = () => {
        this.subscribers.forEach((callback) => {
            callback.call();
        });

        this.loopID = window.requestAnimationFrame(this.loop);
    };
}