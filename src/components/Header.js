import React, {Component} from 'react';

export default class Footer extends Component {

    render() {
        const {limit} = this.props;
        return (
            <div className="outlined" style={{position: 'absolute', width: '100%', textAlign: 'center'}}>
                <h1>Coinbase top {limit} bids/asks</h1>
            </div>
        );
    }
}