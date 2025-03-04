<script>
    import {afterUpdate, getContext, onMount} from 'svelte';
    import {is_function} from 'svelte/internal';
    import {
        createEventClasses,
        createEventContent,
        height,
        toEventWithLocalDates,
        toViewWithLocalDates,
        setContent,
        repositionEvent,
        helperEvent,
        keyEnter,
        task
    } from '@gd-agenda-view/core';

    export let chunk;
    export let longChunks = {};
    export let date; // Date from the Day component

    let {displayEventEnd, eventAllUpdated, eventBackgroundColor, eventTextColor, eventClick, eventColor, eventContent,
        eventClassNames, eventDidMount, eventMouseEnter, eventMouseLeave, theme, slotHeight,
        _view, _intlEventTime, _interaction, _iClasses, _resBgColor, _resTxtColor, _tasks} = getContext('state');

    let el;
    let event;
    let classes;
    let style;
    let content;
    let timeText;
    let margin = 1;
    let display;
    let onclick;

    const normalizeToMidnight = date => {
        const d = new Date(date)
        // Use UTC methods to avoid timezone conversion
        return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    }
    const hasDatePassed = date => {
        const today = normalizeToMidnight(new Date())
        const compareDate = normalizeToMidnight(date)
        return today.getTime() > compareDate.getTime()
    }

    $: event = chunk.event;

    $: {
        display = event.display;

        // Class & Style
        let bgColor = event.textColor || $_resTxtColor(event) || $eventTextColor;
        let txtColor = event.backgroundColor || $_resBgColor(event) || $eventBackgroundColor || $eventColor;

        style =
            `width: 100%;` + // ours aren't spanning so they all have the same width
            `height: ${$slotHeight}px;` + 
            `margin-top: 1px;` + // ours aren't nested so they all have the same height
            (hasDatePassed(date) ? `text-decoration: line-through; text-decoration-thickness: 1.5px;` : '')
        ;
        if (bgColor) {
            style += `background-color:${bgColor};`;
        }
        if (txtColor) {
            style += `color:${txtColor};`;
        }

        if (event.content?.bodyStyleInline) {
            style += event.content.bodyStyleInline;
        }

        classes = [
            $theme.event,
            ...$_iClasses([], event),
            ...createEventClasses($eventClassNames, event, $_view)
        ].join(' ');
    }

    // Content
    $: [timeText, content] = createEventContent(chunk, $displayEventEnd, $eventContent, $theme, $_intlEventTime, $_view);

    onMount(() => {
        if (is_function($eventDidMount)) {
            $eventDidMount({
                event: toEventWithLocalDates(event),
                timeText,
                el,
                view: toViewWithLocalDates($_view)
            });
        }
    });

    afterUpdate(() => {
        if (is_function($eventAllUpdated) && !helperEvent(display)) {
            task(() => $eventAllUpdated({view: toViewWithLocalDates($_view)}), 'eau', _tasks);
        }
    });

    function createHandler(fn, display) {
        return !helperEvent(display) && is_function(fn)
            ? jsEvent => fn({event: toEventWithLocalDates(event), el, jsEvent, view: toViewWithLocalDates($_view)})
            : undefined;
    }

    function createDragHandler(interaction, resize) {
        return interaction.action
            ? jsEvent => interaction.action.drag(event, jsEvent, resize)
            : undefined;
    }

    export function reposition() {
        if (!el) {
            return;
        }
        margin = repositionEvent(chunk, longChunks, height(el));
    }

    // Onclick handler
    $: onclick = createHandler($eventClick, display);
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<article
    bind:this={el}
    class="{classes}"
    {style}
    role="{onclick ? 'button' : undefined}"
    tabindex="{onclick ? 0 : undefined}"
    on:click={onclick}
    on:keydown={onclick && keyEnter(onclick)}
    on:mouseenter={createHandler($eventMouseEnter, display)}
    on:mouseleave={createHandler($eventMouseLeave, display)}
    on:pointerdown={!helperEvent(display) && createDragHandler($_interaction)}
>
    <div class="{$theme.eventBody}" use:setContent={content}></div>
    <svelte:component
        this={$_interaction.resizer}
        {event}
        on:pointerdown={createDragHandler($_interaction, true)}
    />
</article>
