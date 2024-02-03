import { AbstractTimeControl, GameTimeData } from './TimeControl';
import TimeControlType from './TimeControlType';
import { AbsoluteTimeControl } from './time-controls/AbsoluteTimeControl';
import { ByoYomiTimeControl } from './time-controls/ByoYomiTimeControl';
import { FischerTimeControl } from './time-controls/FischerTimeControl';
import { SimpleTimeControl } from './time-controls/SimpleTimeControl';

/**
 * Recreate a time control instance from options and values data.
 *
 * If only options is passed, create a fresh new time control from options.
 * If values are also passed, time control state will be restored to these values.
 *
 * Can make time control emit "elapsed" event if providing values with an elapsed time value.
 */
export const createTimeControl = (
    timeControlType: TimeControlType,
    timeControlValues: null | GameTimeData = null,
): AbstractTimeControl => {

    const { type, options } = timeControlType;
    let timeControl: AbstractTimeControl;

    switch (type) {
        case 'absolute':
            timeControl = new AbsoluteTimeControl(options);
            break;

        case 'simple':
            timeControl = new SimpleTimeControl(options);
            break;

        case 'fischer':
            timeControl = new FischerTimeControl(options);
            break;

        case 'byoyomi':
            timeControl = new ByoYomiTimeControl(options);
            break;
    }

    if (null !== timeControlValues) {
        timeControl.setValues(timeControlValues);
    }

    return timeControl;
};
