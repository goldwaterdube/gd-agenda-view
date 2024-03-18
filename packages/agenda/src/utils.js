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
        end: chunks[0].start.getTime() + (5 * 60000)
    };
    for (let chunk of chunks) {
        let c = 0;
        if (chunk.start < group.end) {
            group.end = group.end + (5 * 60000);
        } else {
            group = {
                columns: [],
                end: chunk.start.getTime() + (5 * 60000)
            };
        }

        group.columns.push(chunk);

        chunk.group = group;
        chunk.column = group.columns.length - 1;
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
