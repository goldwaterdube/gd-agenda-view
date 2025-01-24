import {addDay, datesEqual, createDate, cloneDate, setMidnight, toLocalDate, toISOString, noTimePart, copyTime} from './date';
import {createElement} from './dom';
import {assign} from './utils';
import {toViewWithLocalDates} from './view';
import {is_function} from 'svelte/internal';
import {get} from 'svelte/store'

let eventId = 1;
export function createEvents(input) {
    return input.map(event => ({
        id: 'id' in event ? String(event.id) : `{generated-${eventId++}}`,
        resourceIds: Array.isArray(event.resourceIds)
            ? event.resourceIds.map(String)
            : ('resourceId' in event ? [String(event.resourceId)] : []),
        allDay: event.allDay ?? (noTimePart(event.start) && noTimePart(event.end)),
        start: createDate(event.start),
        end: createDate(event.end),
        completed: event.completed || false,
        title: event.title || '', // component receives html
        details: event.details || '',
        type: event.type || '', // enum string such as court, consult, etc
        district: event.district || '', // component receives a string
        proceeding: event.proceeding || '',
        location: event.location || '', // component receives a string
        ownerInitials: event.ownerInitials || '', // component receives a string
        participantInitials: event.participantInitials || '', // component receives html
        eventSlug: event.eventSlug || '', // component receives html
        url: event.url || '',
        titleHTML: event.titleHTML || '',
        editable: event.editable,
        startEditable: event.startEditable,
        durationEditable: event.durationEditable,
        display: event.display || 'auto',
        extendedProps: event.extendedProps || {},
        backgroundColor: event.backgroundColor || event.color,
        textColor: event.textColor,
    }));
}

export function createEventSources(input) {
    return input.map(source => ({
        events: source.events,
        url: (source.url && source.url.trimEnd('&')) || '',
        method: (source.method && source.method.toUpperCase()) || 'GET',
        extraParams: source.extraParams || {}
    }));
}

export function createEventChunk(event, start, end) {
    return {
        start: event.start > start ? event.start : start,
        end: event.end < end ? event.end : end,
        event
    };
}

export function sortEventChunks(chunks) {
    // Sort by start date (all-day events always on top)
    chunks.sort((a, b) => a.start - b.start || b.event.allDay - a.event.allDay);
}

export function createEventContent(chunk, displayEventEnd, eventContent, theme, _intlEventTime, _view) {
    let timeText = _intlEventTime.formatRange(
        chunk.start,
        displayEventEnd && chunk.event.display !== 'pointer'
            ? copyTime(cloneDate(chunk.start), chunk.end)  // make Intl.formatRange output only the time part
            : chunk.start
    );
    let content;

    if (eventContent) {
        content = is_function(eventContent)
            ? eventContent({
                event: toEventWithLocalDates(chunk.event),
                timeText,
                view: toViewWithLocalDates(_view)
            })
            : eventContent;
    } else {
        let domNodes;
        switch (chunk.event.display) {
            case 'background':
                domNodes = [];
                break;
            case 'pointer':
                domNodes = [createTimeElement(timeText, chunk, theme)];
                break;
            default:
                const e = chunk.event;
                const timeElement = e.hasOwnProperty('start') ? createTimeElement(formatTime(e.start), chunk, theme) : '';
                const typeElement = e.hasOwnProperty('type') ? createElement('div', theme.eventType, e.type) : '';
                const headerMainElement = e.hasOwnProperty('title') ? createElement('h4', theme.eventHeaderMain, {
                    html: `${e.title} ${e.participantInitials ? `(${e.participantInitials})` : ''}`
                }) : '';
                const headerSlimElement = e.hasOwnProperty('title') ? createElement('h4', theme.eventHeaderSlim, e.title) : '';
                const ownerAndParticipantsElement = createElement('h4', theme.eventSlug, { 
                    html: `<span style="white-space: nowrap;">${e?.ownerInitials} ${e?.participantInitials}</span>`
                });

                // Conditional content based on event type
                let bottomLeft = '', bottomRight = '', bottomOverlay = '', bottomHover = '';
                let leftStyle = [], rightStyle = [], overlayStyle = [];

                if (e.type === 'consult') {
                    bottomLeft = e.location || '';
                    bottomRight = e.ownerInitials || '';
                    leftStyle = [['style', `text-align: center`]];
                    rightStyle = [['style', `text-align: center; border-left: 2px solid; border-top: 2px solid; box-sizing: border-box; margin-top: -1px; line-height: 11px`]];
                } else if (e.type === 'meeting') {
                    bottomLeft = e.location || '';
                    bottomRight = e.ownerInitials || '';
                    leftStyle = [['style', `text-align: center`]];
                    rightStyle = [['style', `text-align: center; border-left: 2px solid; border-top: 2px solid; box-sizing: border-box; margin-top: -1px; line-height: 11px`]];
                } else if (e.type === 'court') {
                    bottomHover = e.details || '';
                    bottomOverlay = e.district || '';
                    bottomLeft = e.proceeding || '';
                    bottomRight = e.location || '';
                    overlayStyle = [['style', `text-transform: uppercase; color: red;`]];
                } else if (e.type === 'admin') {
                    bottomOverlay = e.location || '';
                }

                const headerBottomHoverElement = bottomHover ? createElement('h4', theme.eventHeaderBottomHover, bottomHover) : '';
                const headerBottomOverlayElement = bottomOverlay ? createElement('h4', theme.eventHeaderBottomOverlay, bottomOverlay, overlayStyle) : '';
                const headerBottomLeftElement = bottomLeft ? createElement('h4', theme.eventHeaderBottomLeft, bottomLeft, leftStyle) : '';
                const headerBottomRightElement = bottomRight ? createElement('h4', theme.eventHeaderBottomRight, bottomRight, rightStyle) : '';
                
                // Calculate duration in minutes
                const durationMinutes = (chunk.end - chunk.start) / (1000 * 60);
                const headerBottomBorderElement = (e.type !== 'holiday' && e.type !== 'admin' && durationMinutes >= 11) ? createElement('div', 'ec-event-header-bottom-border', '') : '';
                
                let headerNodes = [];
                switch (e.type) {
                    case 'court':
                        headerNodes = [
                            timeElement,
                            headerMainElement,
                            headerBottomLeftElement,
                            headerBottomRightElement,
                            headerBottomHoverElement,
                            headerBottomOverlayElement,
                            headerBottomBorderElement,
                        ];
                        break;
                    case 'consult':
                    case 'meeting':
                        headerNodes = [
                            timeElement,
                            headerMainElement,
                            headerBottomLeftElement,
                            headerBottomRightElement,
                            headerBottomBorderElement,
                        ];
                        break;
                    default:
                        headerNodes = [
                            timeElement,
                            headerMainElement,
                            headerBottomOverlayElement,
                        ];
                }
                
                const eventHeaderElement = createElement('div', 'ec-event-header', { domNodes: headerNodes });
                const hoverHandleElement = !e.allDay ? createElement('div', theme.eventHoverHandle, '') : '';
                const allDayPrefixElement = e.allDay && e.type !== 'receipt' ? createElement('h4', theme.allDayPrefix, 'Note: ') : '';
                const moneyFileElement = e.allDay && e.type === 'receipt' ? createElement('h4', theme.moneyFile, e.title) : '';
                const moneyAmountElement = e.allDay && e.type === 'receipt' ? createElement('h4', theme.moneyAmount, e.details) : '';

                domNodes = [...chunk.event.allDay 
                    ? chunk.event.type === 'receipt' 
                        ? [moneyFileElement, moneyAmountElement] 
                        : [allDayPrefixElement, headerSlimElement, ownerAndParticipantsElement, typeElement]
                    : [eventHeaderElement, hoverHandleElement, typeElement]];
                break;
        }
        content = {domNodes};
    }

    return [timeText, content];
}

function formatTime(date) {
    const hours = date.getUTCHours().toString();
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }  

const TIME_HIGHLIGHT_COLOR = '#fff8e0' // solid yellow to match current day grid alpha color
// const TODAY = new Date()

function createTimeElement(timeText, chunk, theme) {
    // const timeFillColor = TIME_HIGHLIGHT_COLOR
    // const isToday = chunk.start.getFullYear() === TODAY.getFullYear() &&
    //                 chunk.start.getMonth() === TODAY.getMonth() &&
    //                 chunk.start.getDate() === TODAY.getDate()
    // const fillColor = isToday ? timeFillColor : 'white'
    return createElement(
        'time',
        theme.eventTime,
        timeText,
        [
            ['datetime', toISOString(chunk.start)],
            ['style', `background-color: ${'white'};`],
        ]
    );
}

export function createEventClasses(eventClassNames, event, _view) {
    if (eventClassNames) {
        if (is_function(eventClassNames)) {
            eventClassNames = eventClassNames({
                event: toEventWithLocalDates(event),
                view: toViewWithLocalDates(_view)
            });
        }
        return Array.isArray(eventClassNames) ? eventClassNames : [eventClassNames];
    }
    return [];
}

export function toEventWithLocalDates(event) {
    return _cloneEvent(event, toLocalDate);
}

export function cloneEvent(event) {
    return _cloneEvent(event, cloneDate);
}

function _cloneEvent(event, dateFn) {
    event = assign({}, event);
    event.start = dateFn(event.start);
    event.end = dateFn(event.end);

    return event;
}

/**
 * Prepare event chunks for month view and all-day slot in week view
 */
export function prepareEventChunks(chunks, hiddenDays) {
    let longChunks = {};

    if (chunks.length) {
        sortEventChunks(chunks);

        let prevChunk;
        for (let chunk of chunks) {
            let dates = [];
            let date = setMidnight(cloneDate(chunk.start));
            while (chunk.end > date) {
                if (!hiddenDays.includes(date.getUTCDay())) {
                    dates.push(cloneDate(date));
                    if (dates.length > 1) {
                        let key = date.getTime();
                        if (longChunks[key]) {
                            longChunks[key].chunks.push(chunk);
                        } else {
                            longChunks[key] = {
                                sorted: false,
                                chunks: [chunk]
                            };
                        }
                    }
                }
                addDay(date);
            }
            if (dates.length) {
                chunk.date = dates[0];
                chunk.days = dates.length;
                chunk.dates = dates;
                if (chunk.start < dates[0]) {
                    chunk.start = dates[0];
                }
                if (setMidnight(cloneDate(chunk.end)) > dates[dates.length - 1]) {
                    chunk.end = dates[dates.length - 1];
                }
            } else {
                chunk.date = setMidnight(cloneDate(chunk.start));
                chunk.days = 1;
                chunk.dates = [chunk.date];
            }

            if (prevChunk && datesEqual(prevChunk.date, chunk.date)) {
                chunk.prev = prevChunk;
            }
            prevChunk = chunk;
        }
    }

    return longChunks;
}

export function repositionEvent(chunk, longChunks, height) {
    chunk.top = 0;
    if (chunk.prev) {
        chunk.top = chunk.prev.bottom + 1;
    }
    chunk.bottom = chunk.top + height;
    let margin = 1;
    let key = chunk.date.getTime();
    if (longChunks[key]?.sorted || longChunks[key]?.chunks.every(chunk => 'top' in chunk)) {
        if (!longChunks[key].sorted) {
            longChunks[key].chunks.sort((a, b) => a.top - b.top);
            longChunks[key].sorted = true;
        }
        for (let longChunk of longChunks[key].chunks) {
            if (chunk.top < longChunk.bottom && chunk.bottom > longChunk.top) {
                let offset = longChunk.bottom - chunk.top + 1;
                margin += offset;
                chunk.top += offset;
                chunk.bottom += offset;
            }
        }
    }

    return margin;
}

export function runReposition(refs, data) {
    refs.length = data.length;
    for (let ref of refs) {
        ref?.reposition?.();
    }
}

/**
 * Check whether the event intersects with the given date range and resource
 * @param event
 * @param start
 * @param end
 * @param [resource]
 * @param [timeMode]  Zero-length events should be allowed (@see https://github.com/vkurko/calendar/issues/50), except in time mode
 * @return boolean
 */
export function eventIntersects(event, start, end, resource, timeMode) {
    return (
        event.start < end && event.end > start || !timeMode && datesEqual(event.start, event.end, start)
    ) && (
        resource === undefined || event.resourceIds.includes(resource.id)
    );
}

export function helperEvent(display) {
    return previewEvent(display) || ghostEvent(display) || pointerEvent(display);
}

export function bgEvent(display) {
    return display === 'background';
}

export function previewEvent(display) {
    return display === 'preview';
}

export function ghostEvent(display) {
    return display === 'ghost';
}

export function pointerEvent(display) {
    return display === 'pointer';
}
