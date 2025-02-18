import {addDay, datesEqual, createDate, cloneDate, setMidnight, toLocalDate, toISOString, noTimePart, copyTime} from './date';
import {assign} from './utils';
import {toViewWithLocalDates} from './view';
import {is_function} from 'svelte/internal';

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
        kind: event.kind || '', // enum string such as court, consult, etc
        status: event.status || '', // enum string such as completed, cancelled, tentative, etc
        content: event.content || '',
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
            ? copyTime(cloneDate(chunk.start), chunk.end)
            : chunk.start
    );
    let resultContent;

    if (eventContent) {
        resultContent = is_function(eventContent)
            ? eventContent({
                event: toEventWithLocalDates(chunk.event),
                timeText,
                view: toViewWithLocalDates(_view)
            })
            : eventContent;
    } else {
        const e = chunk.event;
        let domNodes = [];

        switch (e.display) {
            case 'background':
                break;
            case 'pointer':
                domNodes = [createStyledElement('time', theme.eventTime, {
                    html: formatTime(chunk.start),
                    style: e.content?.time?.style || {},
                    attributes: [['datetime', toISOString(chunk.start)]]
                })];
                break;
            default:
                const timeElement = e.hasOwnProperty('start') ? createStyledElement('time', theme.eventTime, {
                    html: formatTime(chunk.start),
                    style: e.content?.time?.style || {},
                    attributes: [['datetime', toISOString(chunk.start)]]
                }) : '';
                
                // Create elements from content structure
                const createElementFromStructure = (key, structureItem) => {
                    if (!structureItem) return null;
                    
                    const classMap = {
                        title: theme.eventTitle,
                        oneLineDetails: theme.eventOneLineDetails,
                        headerBottomLeft: theme.eventHeaderBottomLeft,
                        headerBottomRight: theme.eventHeaderBottomRight,
                        headerBottomHover: theme.eventHeaderBottomHover,
                        headerBottomOverlay: theme.eventHeaderBottomOverlay,
                        headerBottomBorder: 'ec-event-header-bottom-border'
                    };

                    return createStyledElement('h4', classMap[key] || '', {
                        html: structureItem.content,
                        style: structureItem.style
                    });
                };

                if (e.allDay) {
                    const allDayPrefix = e.content?.headerTitle?.prefix ? createStyledElement('h4', theme.allDayPrefix, e.content.headerTitle.prefix) : '';
                    domNodes = [
                        allDayPrefix,
                        createElementFromStructure('title', e.content?.headerTitle),
                        createElementFromStructure('eventOneLineDetails', e.content?.oneLineDetails)
                    ].filter(Boolean);
                } else {
                    const headerNodes = [timeElement];
                    
                    // Add header content
                    if (e.content?.headerTitle) {
                        headerNodes.push(createElementFromStructure('title', e.content.headerTitle));
                    }
                    
                    // Add bottom elements
                    ['headerBottomLeft', 'headerBottomRight', 'headerBottomHover', 'headerBottomOverlay', 'headerBottomBorder', 'oneLineDetails']
                        .forEach(key => {
                            if (e.content?.[key]) {
                                headerNodes.push(createElementFromStructure(key, e.content[key]));
                            }
                        });

                    const eventHeader = createStyledElement('div', 'ec-event-header', { domNodes: headerNodes });
                    const hoverHandle = createStyledElement('div', theme.eventHoverHandle, '');
                    
                    domNodes = [eventHeader, hoverHandle];
                }
                break;
        }
        resultContent = {domNodes};
    }

    return [timeText, resultContent];
}

function formatTime(date) {
    const hours = date.getUTCHours().toString();
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}  

const TIME_HIGHLIGHT_COLOR = '#fff8e0' // solid yellow to match current day grid alpha color
// const TODAY = new Date()

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

function createStyledElement(tag, className, content) {
    const element = document.createElement(tag);
    if (className) element.className = className;

    if (content) {
        if (typeof content === 'string') {
            element.innerHTML = content;
        } else if (content.domNodes) {
            content.domNodes.forEach(node => {
                if (node) element.appendChild(node);
            });
        } else if (content.html) {
            element.innerHTML = content.html;
            if (content.style) {
                Object.entries(content.style).forEach(([prop, value]) => {
                    element.style[prop] = value;
                });
            }
        } else if (content.attributes) {
            content.attributes.forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }
    }

    return element;
}
