import React, {Component} from 'react';

export default class Defs extends Component {

    render() {
        return (
            <defs>
                <pattern id="btc" height="100%" width="100%" viewBox="0 0 1 1">
                    <image width="1" height="1" xlinkHref={process.env.PUBLIC_URL + '/images/btc.svg'}/>
                </pattern>
                <pattern id="eth" height="100%" width="100%" viewBox="0 0 1 1">
                    <image width="1" height="1" xlinkHref={process.env.PUBLIC_URL + '/images/eth.svg'}/>
                </pattern>
                <pattern id="ltc" height="100%" width="100%" viewBox="0 0 1 1">
                    <image width="1" height="1" xlinkHref={process.env.PUBLIC_URL + '/images/ltc.svg'}/>
                </pattern>
                <pattern id="usd" height="100%" width="100%" viewBox="0 0 1 1">
                    <image width="1" height="1" xlinkHref={process.env.PUBLIC_URL + '/images/usd.svg'}/>
                </pattern>
                <pattern id="gbp" height="100%" width="100%" viewBox="0 0 1 1">
                    <image width="1" height="1" xlinkHref={process.env.PUBLIC_URL + '/images/gbp.svg'}/>
                </pattern>
                <pattern id="eur" height="100%" width="100%" viewBox="0 0 1 1">
                    <image width="1" height="1" xlinkHref={process.env.PUBLIC_URL + '/images/eur.svg'}/>
                </pattern>
            </defs>
        );
    }
}