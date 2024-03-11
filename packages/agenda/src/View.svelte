<script>
    import {getContext} from 'svelte';
    import {setContent, toISOString} from '@event-calendar/core';
    import Section from './Section.svelte';
    import Body from './Body.svelte';
    import Day from './Day.svelte';
    import Week from './all-day/Week.svelte';

    let {_viewDates, _intlDayHeader, _intlDayHeaderAL, allDaySlot, theme} = getContext('state');

    export function changeZoom(direction) {
    const calendar = document.querySelector('.ec-body');
    const currentZoom = parseFloat(window.getComputedStyle(calendar).getPropertyValue('zoom'));
    const zoomLevelMod = 0.1

    let newZoom;
    switch (direction) {
        case 'increase':
            newZoom = currentZoom + zoomLevelMod;
            break;
        case 'decrease':
            newZoom = Math.max(zoomLevelMod, currentZoom - zoomLevelMod);
            break;
        default:
            newZoom = 1; // Reset zoom to default (100%)
            break;
    }

    calendar.style.zoom = newZoom;
}


</script>

<div style="display: flex;">
    <button on:click={() => changeZoom('decrease')}>Decrease Zoom</button>
    <button on:click={() => changeZoom()}>Reset Zoom</button>
    <button on:click={() => changeZoom('increase')}>Increase Zoom</button>
</div>

<div class="{$theme.header}">
    <Section>
        {#each $_viewDates as date}
            <div class="{$theme.day} {$theme.weekdays?.[date.getUTCDay()]}" role="columnheader">
                <time
                    datetime="{toISOString(date, 10)}"
                    aria-label="{$_intlDayHeaderAL.format(date)}"
                    use:setContent={$_intlDayHeader.format(date)}
                ></time>
            </div>
        {/each}
    </Section>
    <div class="{$theme.hiddenScroll}"></div>
</div>
{#if $allDaySlot}
    <div class="{$theme.allDay}">
        <div class="{$theme.content}">
            <Section>
                <Week dates={$_viewDates}/>
            </Section>
            <div class="{$theme.hiddenScroll}"></div>
        </div>
    </div>
{/if}
<Body>
{#each $_viewDates as date}
    <Day {date}/>
{/each}
</Body>