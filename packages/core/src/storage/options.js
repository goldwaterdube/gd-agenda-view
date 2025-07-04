import {assign, createDate, createDuration, keys, setMidnight, createEvents, createEventSources} from '../lib.js';

export function createOptions(plugins) {
    let options = {
        allDayContent: undefined,
        allDaySlot: true,
        buttonText: {
            today: 'today',
        },
        companyName: '',
        date: new Date(),
        datesSet: undefined,
        dayHeaderFormat: {
            weekday: 'short',
            month: 'numeric',
            day: 'numeric'
        },
        dayHeaderAriaLabelFormat: {
            dateStyle: 'long'
        },
        displayEventEnd: true,
        duration: {weeks: 1},
        events: [],
        eventAllUpdated: undefined,
        eventBackgroundColor: undefined,
        eventTextColor: undefined,
        eventClassNames: undefined,
        eventClick: undefined,
        eventColor: undefined,
        eventContent: undefined,
        eventDidMount: undefined,
        eventMouseEnter: undefined,
        eventMouseLeave: undefined,
        eventSources: [],
        eventTimeFormat: {
            hour: 'numeric',
            minute: '2-digit'
        },
        firstDay: 0,
        flexibleSlotTimeLimits: false,  // ec option
        headerToolbar: {
            start: 'title',
            center: '',
            end: 'today prev,next'
        },
        height: undefined,
        hiddenDays: [],
        highlightedDates: [],  // ec option
        lazyFetching: true,
        loading: undefined,
        locale: undefined,
        allDaySlotOnly: false,
        allDayAutoCross: false,
        allDayPixelPerfect: false,
        nowIndicator: false,
        selectable: false,
        scrollTime: '06:00:00',
        slotDuration: '00:30:00',
        slotEventOverlap: true,
        slotHeight: 24,  // ec option
        slotLabelFormat: {
            hour: 'numeric',
            minute: '2-digit'
        },
        slotMaxTime: '24:00:00',
        slotMinTime: '00:00:00',
        theme: {
            allDay: 'ec-all-day',
            allDayPrefix: 'ec-all-day-prefix',
            active: 'ec-active',
            bgEvent: 'ec-bg-event',
            bgEvents: 'ec-bg-events',
            body: 'ec-body',
            button: 'ec-button',
            buttonGroup: 'ec-button-group',
            calendar: 'ec',
            compact: 'ec-compact',
            content: 'ec-content',
            day: 'ec-day',
            dayHead: 'ec-day-head',
            days: 'ec-days',
            event: 'ec-event',
            eventBody: 'ec-event-body',
            eventHeaderBottomLeft: 'ec-event-header-bottom-left',
            eventHeaderBottomRight: 'ec-event-header-bottom-right',
            eventHeaderBottomHover: 'ec-event-header-bottom-hover',
            eventHeaderBottomOverlay: 'ec-event-header-bottom-overlay',
            eventTitle: 'ec-event-title',
            eventOneLineDetails: 'ec-event-one-line-details',
            eventHoverHandle: 'ec-event-hover-handle',
            eventTime: 'ec-event-time',
            events: 'ec-events',
            extra: 'ec-extra',
            handle: 'ec-handle',
            header: 'ec-header',
            hiddenScroll: 'ec-hidden-scroll',
            highlight: 'ec-highlight',
            icon: 'ec-icon',
            line: 'ec-line',
            lines: 'ec-lines',
            nowIndicator: 'ec-now-indicator',
            otherMonth: 'ec-other-month',
            sidebar: 'ec-sidebar',
            sidebarTitle: 'ec-sidebar-title',
            today: 'ec-today',
            time: 'ec-time',
            title: 'ec-title',
            toolbar: 'ec-toolbar',
            view: '',
            weekdays: ['ec-sun', 'ec-mon', 'ec-tue', 'ec-wed', 'ec-thu', 'ec-fri', 'ec-sat'],
            withScroll: 'ec-with-scroll'
        },
        titleFormat: {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        },
        view: undefined,
        viewDidMount: undefined,
        views: {}
    };

    for (let plugin of plugins) {
        plugin.createOptions?.(options);
    }

    return options;
}

export function createParsers(plugins) {
    let parsers = {
        date: date => setMidnight(createDate(date)),
        duration: createDuration,
        events: createEvents,
        eventSources: createEventSources,
        hiddenDays: days => [...new Set(days)],
        highlightedDates: dates => dates.map(createDate),
        scrollTime: createDuration,
        slotDuration: createDuration,
        slotMaxTime: createDuration,
        slotMinTime: createDuration
    };

    for (let plugin of plugins) {
        plugin.createParsers?.(parsers);
    }

    return parsers;
}

export function diff(options, prevOptions) {
    let diff = [];
    for (let key of keys(options)) {
        if (options[key] !== prevOptions[key]) {
            diff.push([key, options[key]]);
        }
    }
    assign(prevOptions, options);

    return diff;
}
