import React, {Component} from 'react';

export default class Footer extends Component {

    render() {
        return (
            <div className="outlined"
                 style={{position: 'absolute', width: '100%', bottom: '10px', textAlign: 'center', fontSize: '12px'}}>
                <span>Live data from </span>
                <a href="https://coinbase.com/" target="_blank">
                    <img src={process.env.PUBLIC_URL + '/images/coinbase.svg'}
                         height="15" role="presentation"/>
                </a>
                <span>. Made with </span>
                <a href="https://facebook.github.io/react/" target="_blank">
                    <img src={process.env.PUBLIC_URL + '/images/react.svg'}
                         height="25" style={{marginBottom: '-7px'}} role="presentation"/>
                </a>
                <span>. Physics by </span>
                <a href="http://brm.io/matter-js/" target="_blank">
                    <img src={process.env.PUBLIC_URL + '/images/matter-js.svg'}
                         height="18" style={{marginBottom: '-4px'}} role="presentation"/>
                </a>
                <span>.</span>
            </div>
        );
    }
}