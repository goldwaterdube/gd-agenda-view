<script>
    import {getContext} from 'svelte';
    import {setContent, toISOString} from '@gd-agenda-view/core';
    import Section from './Section.svelte';
    import Body from './Body.svelte';
    import Day from './Day.svelte';
    import Week from './all-day/Week.svelte';

    let {_viewDates, _intlDayHeader, _intlDayHeaderAL, allDaySlot, theme} = getContext('state');

    function getWeekNumber(date) {
        const oneJan = new Date(date.getFullYear(), 0, 1)
        const weekNum = Math.ceil(((date - oneJan) / 86400000 + oneJan.getDay() + 1) / 7)
        return weekNum
    }

    function getYearPerspective(date) {
        const year = date.getFullYear()
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
        const daysInYear = isLeapYear ? 366 : 365
        const startOfYear = new Date(year, 0, 0)
        const diff = date - startOfYear
        const oneDay = 1000 * 60 * 60 * 24
        const daysElapsed = Math.floor(diff / oneDay)
        const daysRemaining = daysInYear - daysElapsed
        return `${daysElapsed}/${daysRemaining}`
    }

    // formatted the column headers dirty and nonprogrammatically
    function formatDateForAgenda(date) {
        const localDate = new Date(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds())

        const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        
        const dayOfMonth = localDate.getDate().toString().padStart(2, '0')
        const month = months[localDate.getMonth()]
        const year = localDate.getFullYear()
        const weekDay = weekDays[localDate.getDay()]
        const weekNumber = `Week ${getWeekNumber(localDate)}`
        const yearPerspective = getYearPerspective(localDate)
        const header = `${month} ${year}`

        return {dayOfMonth, weekDay, header, weekNumber, yearPerspective}
    }
</script>



<div class="ec-top-header">
    <Section>
        {#each $_viewDates as date}
            {@const formattedDate = formatDateForAgenda(date)}
            <div class="{$theme.day}">
                <div style="display: flex;">
                    {#if formattedDate.weekDay === 'Monday' || formattedDate.dayOfMonth === '01'}
                    <div use:setContent={formattedDate.header} class="ec-day-month-year"></div>
                    {/if}
                    {#if formattedDate.weekDay === 'Monday'}
                    <div use:setContent={formattedDate.weekNumber} class="ec-day-week-number"></div>
                    {/if}
                </div>
            </div>
        {/each}
    </Section>
</div>
<div class="{$theme.header}">
    <Section>
        {#each $_viewDates as date}
            {@const formattedDate = formatDateForAgenda(date)}
            <div class="{$theme.day} {$theme.weekdays?.[date.getUTCDay()]}" role="columnheader">
                <time
                    datetime="{toISOString(date, 10)}"
                    aria-label="{$_intlDayHeader.format(date)}"
                >
                    <div style="display: flex;">
                        <div use:setContent={formattedDate.dayOfMonth} class="ec-day-of-month"></div>
                        <div use:setContent={formattedDate.weekDay} class="ec-day-week-day"></div>
                    </div>
                    <div style="display: flex;">
                        <div use:setContent={formattedDate.yearPerspective} class="ec-day-year-perspective"></div>
                        <div use:setContent={""} class="ec-day-anniversary"></div>
                    </div>    
                </time>
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