import React, {Component} from 'react';
import Loop from '../game/Loop';
import Walls from './Walls';
import World from '../game/World';
import Defs from './Defs';
import Orders from './Orders';
import Fader from './Fader';
import Header from './Header';
import Footer from './Footer';
import Loading from './Loading';
import Tones from '../utils/Tones';
import {Vector, Events} from 'matter-js';

export default class App extends Component {
    constructor() {
        super(...arguments);
        this.tones = new Tones(16);
        this.waves = {
            'BTC-USD': 'sine',
            'BTC-GBP': 'sine',
            'BTC-EUR': 'sine',
            'ETH-USD': 'triangle',
            'ETH-BTC': 'triangle',
            'LTC-USD': 'sawtooth',
            'LTC-BTC': 'sawtooth'
        };
        this.state = {
            width: 1,
            height: 1,
            ready: false,
            products: ['BTC-USD', 'BTC-GBP', 'BTC-EUR', 'ETH-USD', 'ETH-BTC', 'LTC-USD', 'LTC-BTC'],
            enabledProducts: ['BTC-USD', 'ETH-USD', 'LTC-USD']
        };
    }

    componentWillMount() {
        this.updateDimensions();
    }

    componentDidMount() {
        window.addEventListener('resize', this.updateDimensions);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateDimensions);
    }

    updateDimensions = () => {
        this.setState({
            width: window.innerWidth,
            height: window.innerHeight
        });
    };

    render() {
        const {width, height, ready, products, enabledProducts} = this.state;
        const border = 0;
        const limit = 10;
        return (
            <div>
                <Loop>
                    <World gravity={{x: 0, y: 0}}
                           bounds={{min: {x: border, y: border}, max: {x: width - border, y: height - border}}}
                           onCollision={(event) => this.onCollision(event)}>
                        <svg width={width} height={height} xmlns="http://www.w3.org/2000/svg" version="1.1">
                            <Defs/>
                            <Walls width={width} height={height} border={border}/>
                            <Orders width={width} height={height} border={border}
                                    products={products} enabledProducts={enabledProducts} limit={limit}
                                    onReady={() => this.onReady()}/>
                        </svg>
                    </World>
                </Loop>
                {ready &&
                <Fader>
                    <Header limit={limit} products={products} enabledProducts={enabledProducts}
                            onChange={(newEnabledProducts) => this.setState({enabledProducts: newEnabledProducts})}/>
                    <Footer/>
                </Fader>
                }
                {!ready &&
                <Loading/>}
            </div>
        );
    }

    onReady() {
        this.setState({
            ready: true
        });
    }

    onCollision(event) {
        event.pairs.forEach((pair) => {
            this.triggerSound(pair.bodyA, pair.bodyB);
            this.triggerAttractorCollision(pair.bodyA, pair.bodyB);
        });
    }

    triggerSound(bodyA, bodyB) {
        //Frequencies:
        //0.01 btc = 1440
        //0.1 btc = 880
        //1 btc = 440
        //10 btc = 220
        //100 btc = 110
        //1000 btc = 55

        const {width, height} = this.state;
        const magScale = 10000 / (width * height);

        if (!(bodyA.order && bodyB.order)) {
            return;
        }

        const bodyAMomentum = Vector.mult(bodyA.velocity, bodyA.mass);
        const bodyBMomentum = Vector.mult(bodyB.velocity, bodyB.mass);
        const relativeMomentum = Vector.sub(bodyAMomentum, bodyBMomentum);
        const magnitude = Vector.magnitude(relativeMomentum);
        const attracted = bodyA.gravity.attractors.indexOf(bodyB) >= 0;
        const maxGain = attracted ? 1 : 0.1;
        const gain = Math.min(maxGain, magScale * magnitude);
        const length = gain;

        for (let i = 0; i < 2; i++) {
            const body = i === 0 ? bodyA : bodyB;
            const btc = body.orderSize * body.order.book.getSizeInBTCMultiplier();
            const log = Math.log10(btc) + Math.random() * 0.1;
            const freq = 440 * Math.pow(2, -log);
            const pan = Math.max(-1, Math.min(1, 2 * body.position.x / width - 1));
            this.tones.play(freq, gain, length, pan, attracted ? this.waves[body.order.product] : 'sine');
        }
    }

    triggerAttractorCollision(bodyA, bodyB) {
        if (!(bodyA.gravity && bodyB.gravity)) {
            return;
        }
        const attractorsA = bodyA.gravity.attractors || [];
        const attractorsB = bodyB.gravity.attractors || [];
        if (!(attractorsA.length && attractorsB.length)) {
            return;
        }
        if (attractorsA.indexOf(bodyB) >= 0) {
            Events.trigger(bodyA, 'attractorCollision', {body: bodyB});
        }
        if (attractorsB.indexOf(bodyA) >= 0) {
            Events.trigger(bodyB, 'attractorCollision', {body: bodyA});
        }
    }
}