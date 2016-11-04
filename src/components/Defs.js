import React, {Component} from 'react';

export default class Defs extends Component {

    render() {
        return (
            <defs>
                <pattern id="btc" height="100%" width="100%" viewBox="0 0 1 1">
                    <image width="1" height="1" xlinkHref="/images/btc.svg"/>
                </pattern>
                <pattern id="eth" height="100%" width="100%" viewBox="0 0 1 1">
                    <image width="1" height="1" xlinkHref="/images/eth.svg"/>
                </pattern>
                <pattern id="ltc" height="100%" width="100%" viewBox="0 0 1 1">
                    <image width="1" height="1" xlinkHref="/images/ltc.svg"/>
                </pattern>
                <pattern id="usd" height="100%" width="100%" viewBox="0 0 1 1">
                    <image width="1" height="1" xlinkHref="/images/usd.svg"/>
                </pattern>
                <pattern id="gbp" height="100%" width="100%" viewBox="0 0 1 1">
                    <image width="1" height="1" xlinkHref="/images/gbp.svg"/>
                </pattern>
                <pattern id="eur" height="100%" width="100%" viewBox="0 0 1 1">
                    <image width="1" height="1" xlinkHref="/images/eur.svg"/>
                </pattern>
            </defs>
        );
    }
}