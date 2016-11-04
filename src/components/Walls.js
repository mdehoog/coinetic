import React, {Component} from 'react';
import Wall from './Wall';

export default class Walls extends Component {

    render() {
        const {width, height, border} = this.props;
        const length = 10000;
        const thick = 1000;
        const offset = thick / 2 - border;
        return (
            <g>
                <Wall label={'wall-left'} x={-offset} y={length / 2} width={thick} height={length} isStatic={true}/>
                <Wall label={'wall-right'} x={width + offset} y={length / 2} width={thick} height={length} isStatic={true}/>
                <Wall label={'wall-top'} x={length / 2} y={-offset} width={length} height={thick} isStatic={true}/>
                <Wall label={'wall-bottom'} x={length / 2} y={height + offset} width={length} height={thick} isStatic={true}/>
            </g>
        );
    }
}