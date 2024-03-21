<script>
    import {afterUpdate, getContext, onMount} from 'svelte';
    import {is_function} from 'svelte/internal';
    import {
        createEventContent,
        createEventClasses,
        toEventWithLocalDates,
        toViewWithLocalDates,
        setContent,
        bgEvent,
        helperEvent,
        ghostEvent,
        keyEnter,
        task
    } from './../../core/'; // don't point to the node package for dev
    // } from '@event-calendar/core';
  import { fade } from 'svelte/transition';

    export let date;
    export let chunk;

    let {displayEventEnd, eventAllUpdated, eventBackgroundColor, eventTextColor,eventColor, eventContent, eventClick,
        eventDidMount, eventClassNames, eventMouseEnter, eventMouseLeave, slotEventOverlap, slotDuration, slotHeight, theme,
        _view, _intlEventTime, _interaction, _iClasses, _resBgColor, _resTxtColor, _slotTimeLimits, _tasks} = getContext('state');

    let el;
    let event;
    let display;
    let classes;
    let style;
    let content;
    let timeText;
    let onclick;

    $: event = chunk.event;

    $: {
        display = event.display;

        // Style
        let step = $slotDuration.seconds / 60;
        let offset = $_slotTimeLimits.min.seconds / 60;
        let start = (chunk.start - date) / 1000 / 60;
        let end = (chunk.end - date) / 1000 / 60;
        let top = (start - offset) / step * $slotHeight;
        let height = (end - start) / step * $slotHeight;
        let maxHeight = ($_slotTimeLimits.max.seconds / 60 - start) / step * $slotHeight;
        let bgColor = event.backgroundColor || $_resBgColor(event) || $eventBackgroundColor || $eventColor;
        let txtColor = bgColor
        let over = event.over || false
        style =
            `top:${top + chunk.column * $slotHeight}px;` + // bug: this dynamic positioning makes the event hover on 8:00 during drag and resize, but these two features should likely be disabled anyway
            `min-height:${height}px;` +
            `height:${height}px;` +
            `max-height:${maxHeight}px;`
        ;
        if (bgColor) {
            style += `border: 2px solid ${bgColor};`;
        }
        if (txtColor) {
            style += `color:${txtColor};`;
        }
        if (!bgEvent(display) && !helperEvent(display) || ghostEvent(display)) {
            style +=
                `z-index:${chunk.column + 1};` +
                `left:${$slotEventOverlap ? 0 : 0 }%;` +
                `width:${$slotEventOverlap ? 98 : 98 }%;`
            ;
        }
        if (over) {
            style += `background: ` + 
                     `linear-gradient(to top right, transparent calc(50% - 1.5px), ${bgColor} , transparent calc(50% + 1.5px)), ` + 
                     `linear-gradient(to top left, transparent calc(50% - 1.5px), ${bgColor} , transparent calc(50% + 1.5px))`
        }

        // Class
        classes = [
            bgEvent(display) ? $theme.bgEvent : $theme.event,
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

    // Onclick handler
    $: onclick = !bgEvent(display) && createHandler($eventClick, display);
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
    on:pointerdown={!bgEvent(display) && !helperEvent(display) && createDragHandler($_interaction)}
>
    <div class="{$theme.eventBody}" use:setContent={content}></div>
    <svelte:component
        this={$_interaction.resizer}
        {event}
        on:pointerdown={createDragHandler($_interaction, true)}
    />
</article>
