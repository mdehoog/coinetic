import React, {Component} from 'react';

export default class Defs extends Component {

    render() {
        const style = {
            position: 'absolute',
            width: '100%',
            top: '50%',
            marginTop: '-40px',
            textAlign: 'center'
        };
        return (
            <div className="outlined" style={style}>
                <h2>Loading orderbooks, please wait...</h2>
            </div>
        );
    }
}