import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import Matter, {Common} from 'matter-js';
import './index.css';
import './plugins/index';

Matter.use(
    'attractor-gravity',
    'fix-body-inertia',
    'enforce-world-bounds'
);

//polyfill for IE
Math.log10 = Math.log10 || function (x) {
        return Math.log(x) / Math.LN10;
    };

//fix Matter.js Common.isString() for IE (https://github.com/liabru/matter-js/pull/311)
Common.isString = function (obj) {
    return Object.prototype.toString.call(obj) === '[object String]';
};

ReactDOM.render(
    <App />,
    document.getElementById('root')
);