import Calendar from '@gd-agenda-view/core';
import DayGrid from '@gd-agenda-view/day-grid';
import List from '@gd-agenda-view/list';
import TimeGrid from '@gd-agenda-view/time-grid';
import ResourceTimeGrid from '@gd-agenda-view/resource-time-grid';
import Interaction from '@gd-agenda-view/interaction';
import Agenda from '@gd-agenda-view/agenda';
import '@gd-agenda-view/core/index.css';

export default class extends Calendar {
    constructor(el, options) {
        super({
            target: el,
            props: {
                plugins: [DayGrid, List, TimeGrid, ResourceTimeGrid, Interaction, Agenda],
                options
            }
        });
    }

    get view() {
        return this.getView();
    }
}
