import React, {Component} from 'react';

export default class Header extends Component {

    onToggle(checked, product) {
        const {enabledProducts, onChange} = this.props;
        const enabled = enabledProducts.indexOf(product) >= 0;
        if (checked === enabled) {
            return;
        }
        const newEnabledProducts = enabledProducts.filter((e) => {
            return e !== product;
        });
        if (newEnabledProducts.length === enabledProducts.length) {
            //product was not removed; add instead
            newEnabledProducts.push(product);
        }
        onChange(newEnabledProducts);
    }

    render() {
        const {limit, products, enabledProducts} = this.props;
        const inputs = products.map((product) => {
            return (
                <span key={product}>
                    <input type="checkbox" id={product}
                           checked={enabledProducts.indexOf(product) >= 0}
                           onChange={(event) => this.onToggle(event.target.checked, product)}/>
                    <label htmlFor={product}>{product}</label>
                    &nbsp;&nbsp;
                </span>
            );
        });
        return (
            <div className="outlined" style={{position: 'absolute', width: '100%', textAlign: 'center'}}>
                <h1>Coinbase top {limit} bids/asks</h1>
                <div style={{fontSize: '12px'}}>
                    {inputs}
                </div>
            </div>
        );
    }
}