let parsedData = [];
let hiddenEvents = new Set();
let interestedEvents = new Set();

// Load data from JSON file
async function loadScheduleData() {
  try {
    const response = await fetch('data/schedule.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Add durationMinutes if not present
    data.forEach((event) => {
      if (event.duration && !event.durationMinutes) {
        const match = event.duration.match(/(\d+)'/);
        if (match) {
          event.durationMinutes = parseInt(match[1]);
        }
      }
    });

    parsedData = data;
    document.getElementById('loading').style.display = 'none';
    displayCalendar();
    loadUserPreferences();
  } catch (error) {
    console.error('Error loading schedule:', error);
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('error').innerHTML = `
            <strong>Error loading schedule:</strong><br>
            ${error.message}<br><br>
            <strong>Make sure:</strong><br>
            • The data/schedule.json file exists<br>
            • The server is running (try: python -m http.server)<br>
        `;
  }
}

function saveUserPreferences() {
  const preferences = {
    hidden: Array.from(hiddenEvents),
    interested: Array.from(interestedEvents),
  };
  localStorage.setItem('festivalPlannerPrefs', JSON.stringify(preferences));
}

function loadUserPreferences() {
  try {
    const saved = localStorage.getItem('festivalPlannerPrefs');
    if (saved) {
      const preferences = JSON.parse(saved);
      hiddenEvents = new Set(preferences.hidden || []);
      interestedEvents = new Set(preferences.interested || []);
      updateEventVisibility();
      updateCounts();
    }
  } catch (error) {
    console.error('Error loading preferences:', error);
  }
}

function getEventId(event) {
  return `${event.event}-${event.time}-${event.venue}-${event.day}-${event.date}`;
}

function toggleEventHidden(eventId) {
  if (hiddenEvents.has(eventId)) {
    hiddenEvents.delete(eventId);
  } else {
    hiddenEvents.add(eventId);
    interestedEvents.delete(eventId); // Can't be both
  }
  updateEventVisibility();
  updateCounts();
  saveUserPreferences();
}

function toggleEventInterested(eventId) {
  if (interestedEvents.has(eventId)) {
    interestedEvents.delete(eventId);
  } else {
    interestedEvents.add(eventId);
    hiddenEvents.delete(eventId); // Can't be both
  }
  updateEventVisibility();
  updateCounts();
  saveUserPreferences();
}

function updateEventVisibility() {
  document.querySelectorAll('.event-item').forEach((element) => {
    const eventId = element.getAttribute('data-event-id');

    element.classList.remove('hidden', 'interested');

    if (hiddenEvents.has(eventId)) {
      element.classList.add('hidden');
    } else if (interestedEvents.has(eventId)) {
      element.classList.add('interested');
    }
  });
}

function updateCounts() {
  document.getElementById(
    'hiddenCount'
  ).textContent = `Hidden: ${hiddenEvents.size}`;
  document.getElementById(
    'interestedCount'
  ).textContent = `Interested: ${interestedEvents.size}`;
}

function showAllEvents() {
  document.querySelectorAll('.event-item').forEach((element) => {
    element.style.display = '';
  });
}

function showOnlyInterested() {
  document.querySelectorAll('.event-item').forEach((element) => {
    const eventId = element.getAttribute('data-event-id');
    if (interestedEvents.has(eventId)) {
      element.style.display = '';
    } else {
      element.style.display = 'none';
    }
  });
}

function showHiddenEvents() {
  // Make hidden events visible but keep them styled as hidden
  document.querySelectorAll('.event-item.hidden').forEach((element) => {
    element.style.display = '';
    element.style.setProperty('pointer-events', 'auto', 'important'); // Re-enable interactions

    // Also ensure the controls are visible and clickable
    const controls = element.querySelector('.event-controls');
    if (controls) {
      controls.style.display = 'flex';
      controls.style.setProperty('pointer-events', 'auto', 'important');
    }
  });
}

function unhideAllEvents() {
  hiddenEvents.clear();
  updateEventVisibility();
  updateCounts();
  saveUserPreferences();
}

function exportMyPlan() {
  const myEvents = parsedData.filter((event) =>
    interestedEvents.has(getEventId(event))
  );

  const planText = myEvents
    .map((event) => {
      const endTime = calculateEndTime(event.time, event.durationMinutes || 0);
      return `${event.day} ${event.date} | ${event.time}-${endTime} | ${
        event.venue
      }\n${event.event}\n${event.movie || 'N/A'}\n---`;
    })
    .join('\n\n');

  const blob = new Blob([planText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-festival-plan.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Show success message
  const successMsg = document.createElement('div');
  successMsg.className = 'success';
  successMsg.textContent = `✅ Exported ${myEvents.length} events to your plan!`;
  document.querySelector('.controls-section').appendChild(successMsg);
  setTimeout(() => successMsg.remove(), 3000);
}

function calculateEndTime(startTime, durationMinutes) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + durationMinutes;
  const endHours = Math.floor(endMinutes / 60);
  const endMins = endMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMins
    .toString()
    .padStart(2, '0')}`;
}

function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins
    .toString()
    .padStart(2, '0')}`;
}

function generateTimeSlots(events) {
  const allTimes = new Set();

  events.forEach((event) => {
    if (event.time && event.durationMinutes) {
      const startMinutes = timeToMinutes(event.time);
      const endMinutes = startMinutes + event.durationMinutes;

      for (let t = startMinutes; t < endMinutes; t += 15) {
        allTimes.add(t);
      }
      allTimes.add(endMinutes);
    }
  });

  return Array.from(allTimes).sort((a, b) => a - b);
}

function createCalendarGrid(events) {
  const dayMap = {
    Dilluns: 'Monday',
    Dimarts: 'Tuesday',
    Dimecres: 'Wednesday',
    Dijous: 'Thursday',
    Divendres: 'Friday',
    Dissabte: 'Saturday',
    Diumenge: 'Sunday',
  };

  const eventsByDay = {};
  events.forEach((event) => {
    const dayKey = `${event.day} ${event.date}`;
    if (!eventsByDay[dayKey]) {
      eventsByDay[dayKey] = [];
    }
    eventsByDay[dayKey].push(event);
  });

  const allVenues = [
    ...new Set(events.map((e) => e.venue).filter((v) => v)),
  ].sort();

  let html = '';

  // Sort days by date number, handling the proper chronological order
  const sortedDayKeys = Object.keys(eventsByDay).sort((a, b) => {
    const dateA = parseInt(a.split(' ')[1]);
    const dateB = parseInt(b.split(' ')[1]);
    return dateA - dateB;
  });

  sortedDayKeys.forEach((dayKey) => {
    const dayEvents = eventsByDay[dayKey];
    const dayInfo = dayKey.split(' ');
    const dayName = dayMap[dayInfo[0]] || dayInfo[0];
    const dayNumber = dayInfo[1];

    const timeSlots = generateTimeSlots(dayEvents);

    html += `
            <div class="day-section">
                <div class="day-title">${dayName}, ${dayNumber}</div>
                <table class="schedule-table">
                    <thead>
                        <tr>
                            <th class="time-header">Time</th>
                            ${allVenues
                              .map(
                                (venue) =>
                                  `<th class="venue-header">${venue}</th>`
                              )
                              .join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;

    const grid = {};
    timeSlots.forEach((timeSlot) => {
      grid[timeSlot] = {};
      allVenues.forEach((venue) => {
        grid[timeSlot][venue] = null;
      });
    });

    const occupiedCells = new Set();
    dayEvents.forEach((event) => {
      if (event.time && event.durationMinutes && event.venue) {
        const startMinutes = timeToMinutes(event.time);
        const endMinutes = startMinutes + event.durationMinutes;

        const startSlot =
          timeSlots.find((slot) => slot >= startMinutes) || startMinutes;
        grid[startSlot][event.venue] = event;

        timeSlots.forEach((slot) => {
          if (slot >= startMinutes && slot < endMinutes) {
            occupiedCells.add(`${slot}-${event.venue}`);
          }
        });
      }
    });

    timeSlots.forEach((timeSlot) => {
      html += `<tr><td class="time-cell">${minutesToTime(timeSlot)}</td>`;

      allVenues.forEach((venue) => {
        const cellKey = `${timeSlot}-${venue}`;
        const event = grid[timeSlot][venue];

        if (event) {
          const eventStartMinutes = timeToMinutes(event.time);
          const eventEndMinutes = eventStartMinutes + event.durationMinutes;
          const slotsSpanned = timeSlots.filter(
            (slot) => slot >= eventStartMinutes && slot < eventEndMinutes
          ).length;

          const isMultiMovie = event.movies && event.movies.length > 1;

          let eventClass = 'event-item';
          if (isMultiMovie) eventClass += ' event-multi-movie';

          const movieText = isMultiMovie
            ? `${event.movies.length} movies`
            : (event.movie || '').substring(0, 30) +
              (event.movie && event.movie.length > 30 ? '...' : '');

          const heightPerSlot = 38;
          const totalHeight = Math.max(slotsSpanned * heightPerSlot - 4, 34);
          const eventId = getEventId(event);
          const escapedEventId = eventId
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"');

          html += `<td class="event-cell" style="position: relative;">
                        <div class="${eventClass}" 
                             data-event-id="${eventId}"
                             style="height: ${totalHeight}px; z-index: 2;"
                             onmouseover="showTooltip(event, this)"
                             onmouseout="hideTooltip()"
                             onclick="event.stopPropagation()">
                            <div class="event-title">${event.event.substring(
                              0,
                              20
                            )}${event.event.length > 20 ? '...' : ''}</div>
                            <div class="event-movie">${movieText}</div>
                            <div class="event-duration">${
                              event.duration || ''
                            }</div>
                            ${
                              event.sections && event.sections.length > 0
                                ? `<div class="event-sections">${event.sections[0].substring(
                                    0,
                                    12
                                  )}${
                                    event.sections[0] &&
                                    event.sections[0].length > 12
                                      ? '...'
                                      : ''
                                  }</div>`
                                : ''
                            }
                            <div class="event-controls">
                                <button class="event-btn btn-interested" onclick="toggleEventInterested('${escapedEventId}')" title="Mark as interested">⭐</button>
                                <button class="event-btn btn-hide" onclick="toggleEventHidden('${escapedEventId}')" title="Hide/Unhide event">❌</button>
                            </div>
                        </div>
                    </td>`;
        } else if (occupiedCells.has(cellKey)) {
          html += '<td class="event-cell"></td>';
        } else {
          html += '<td class="event-cell"></td>';
        }
      });

      html += '</tr>';
    });

    html += `
                    </tbody>
                </table>
            </div>
        `;
  });

  return html;
}

function showTooltip(e, element) {
  const tooltip = document.getElementById('tooltip');
  const eventId = element.getAttribute('data-event-id');

  const eventData = parsedData.find((event) => getEventId(event) === eventId);

  if (!eventData) return;

  const endTime = calculateEndTime(
    eventData.time,
    eventData.durationMinutes || 0
  );

  let tooltipHtml = `
        <strong>${eventData.event}</strong><br>
        <strong>Time:</strong> ${eventData.time} - ${endTime}<br>
        <strong>Venue:</strong> ${eventData.venue}<br>
        <strong>Duration:</strong> ${eventData.duration || 'N/A'}<br>
    `;

  if (eventData.movies && eventData.movies.length > 0) {
    tooltipHtml += `<strong>Movies:</strong><br>`;
    eventData.movies.forEach((movie) => {
      tooltipHtml += `• ${movie}<br>`;
    });
  }

  if (eventData.sections && eventData.sections.length > 0) {
    tooltipHtml += `<strong>Sections:</strong> ${eventData.sections.join(
      ', '
    )}<br>`;
  }

  if (eventData.special_tags && eventData.special_tags.length > 0) {
    tooltipHtml += `<strong>Special:</strong> ${eventData.special_tags.join(
      ', '
    )}`;
  }

  tooltip.innerHTML = tooltipHtml;
  tooltip.style.display = 'block';
  tooltip.style.left = e.pageX + 10 + 'px';
  tooltip.style.top = e.pageY + 10 + 'px';
}

function hideTooltip() {
  document.getElementById('tooltip').style.display = 'none';
}

function generateStats(events) {
  const visibleEvents = events.filter((e) => !hiddenEvents.has(getEventId(e)));
  const myEvents = events.filter((e) => interestedEvents.has(getEventId(e)));

  const stats = {
    totalEvents: events.length,
    visibleEvents: visibleEvents.length,
    myEvents: myEvents.length,
    totalDays: new Set(events.map((e) => `${e.day} ${e.date}`)).size,
    totalVenues: new Set(events.map((e) => e.venue).filter((v) => v)).size,
    myHours: Math.round(
      myEvents.reduce((sum, e) => sum + (e.durationMinutes || 0), 0) / 60
    ),
  };

  return `
        <div class="stats">
            <div class="stat-item">
                <div class="stat-number">${stats.visibleEvents}</div>
                <div class="stat-label">Visible Events</div>
            </div>
            <div class="stat-item">
                <div class="stat-number" style="color: #007bff;">${stats.myEvents}</div>
                <div class="stat-label">⭐ My Plan</div>
            </div>
            <div class="stat-item">
                <div class="stat-number" style="color: #28a745;">${stats.myHours}h</div>
                <div class="stat-label">My Festival Hours</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${stats.totalDays}</div>
                <div class="stat-label">Festival Days</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${stats.totalVenues}</div>
                <div class="stat-label">Venues</div>
            </div>
        </div>
    `;
}

function displayCalendar() {
  document.getElementById('stats').innerHTML = generateStats(parsedData);
  document.getElementById('calendar').innerHTML =
    createCalendarGrid(parsedData);
  updateCounts();
}

// Initialize
window.onload = function () {
  loadScheduleData();
};
