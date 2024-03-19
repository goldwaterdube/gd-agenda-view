import {is_function} from 'svelte/internal';
import {sortEventChunks} from '@event-calendar/core';

export function groupEventChunks(chunks) {
    if (!chunks.length) {
        return;
    }

    sortEventChunks(chunks);
    
    // Group
    let group = {
        columns: [],
        end: chunks[0].start.getTime()
    };
    const fiveMinutes = (5 * 60000)
    for (let chunk of chunks) {
        let shift = 0;
        if (chunk.start < group.end) {
            shift = (group.end - chunk.start) / fiveMinutes
            chunk.end = new Date(Math.max(chunk.start.getTime() + fiveMinutes, chunk.end.getTime() - (shift * fiveMinutes)))
            group.end = group.end + fiveMinutes;
        } else {
            shift = 0
            group = {
                columns: [],
                end: chunk.start.getTime() + fiveMinutes
            };
        }

        group.columns.push(chunk);

        chunk.group = group;
        chunk.column = shift; 
        // In Agenda, column === shift downwards: I didn't want to redo the whole event structure for this view only
    }
}

export function createAllDayContent(allDayContent) {
    let text = 'all-day';
    let content;
    if (allDayContent) {
        content = is_function(allDayContent) ? allDayContent({text}) : allDayContent;
        if (typeof content === 'string') {
            content = {html: content};
        }
    } else {
        content = {
            html: text
        };
    }

    return content;
}
