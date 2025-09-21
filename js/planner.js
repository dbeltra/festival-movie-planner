let parsedData = [];
let hiddenEvents = new Set();
let interestedEvents = new Set();
let selectedEvents = new Set();

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
    loadUserPreferences();
    displayCalendar();
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
    selected: Array.from(selectedEvents),
  };
  localStorage.setItem('festivalPlannerPrefs', JSON.stringify(preferences));
}

function loadUserPreferences() {
  try {
    const saved = localStorage.getItem('festivalPlannerPrefs');
    console.log('Loading preferences, saved data:', saved);
    if (saved) {
      const preferences = JSON.parse(saved);
      console.log('Parsed preferences:', preferences);
      hiddenEvents = new Set(preferences.hidden || []);
      interestedEvents = new Set(preferences.interested || []);
      selectedEvents = new Set(preferences.selected || []);
      console.log(
        'Loaded preferences - Hidden:',
        hiddenEvents.size,
        'Interested:',
        interestedEvents.size,
        'Selected:',
        selectedEvents.size
      );
      // Don't call updateEventVisibility here - DOM elements don't exist yet
      // This will be called after displayCalendar() creates the elements
    } else {
      console.log('No saved preferences found');
    }
  } catch (error) {
    console.error('Error loading preferences:', error);
  }
}

function getEventId(event) {
  const id = `${event.event}-${event.time}-${event.venue}-${event.day}-${event.date}`;
  // console.log('Generated event ID:', id); // Uncomment for debugging
  return id;
}

function toggleEventHidden(eventId) {
  if (hiddenEvents.has(eventId)) {
    hiddenEvents.delete(eventId);
  } else {
    hiddenEvents.add(eventId);
    interestedEvents.delete(eventId); // Can't be interested and hidden
    selectedEvents.delete(eventId); // Can't be selected and hidden
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
    hiddenEvents.delete(eventId); // Can't be hidden and interested
    selectedEvents.delete(eventId); // Can't be selected and interested
  }
  updateEventVisibility();
  updateCounts();
  saveUserPreferences();
}

function toggleEventSelected(eventId) {
  if (selectedEvents.has(eventId)) {
    selectedEvents.delete(eventId);
  } else {
    selectedEvents.add(eventId);
    hiddenEvents.delete(eventId); // Can't be hidden and selected
    interestedEvents.delete(eventId); // Can't be interested and selected
  }
  updateEventVisibility();
  updateCounts();
  saveUserPreferences();
}

function updateEventVisibility() {
  const eventItems = document.querySelectorAll('.event-item');

  eventItems.forEach((element) => {
    const eventId = element.getAttribute('data-event-id');

    element.classList.remove('hidden', 'interested', 'selected');

    if (hiddenEvents.has(eventId)) {
      element.classList.add('hidden');
    } else if (interestedEvents.has(eventId)) {
      element.classList.add('interested');
    } else if (selectedEvents.has(eventId)) {
      element.classList.add('selected');
    }
  });
}

function updateCounts() {
  const hiddenCountEl = document.getElementById('hiddenCount');
  const interestedCountEl = document.getElementById('interestedCount');
  const selectedCountEl = document.getElementById('selectedCount');

  if (hiddenCountEl) {
    hiddenCountEl.textContent = `Hidden: ${hiddenEvents.size}`;
  }
  if (interestedCountEl) {
    interestedCountEl.textContent = `Interested: ${interestedEvents.size}`;
  }
  if (selectedCountEl) {
    selectedCountEl.textContent = `Selected: ${selectedEvents.size}`;
  }
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

function showOnlySelected() {
  document.querySelectorAll('.event-item').forEach((element) => {
    const eventId = element.getAttribute('data-event-id');
    if (selectedEvents.has(eventId)) {
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
  const interestedEventsData = parsedData.filter((event) =>
    interestedEvents.has(getEventId(event))
  );
  const selectedEventsData = parsedData.filter((event) =>
    selectedEvents.has(getEventId(event))
  );
  const hiddenEventsData = parsedData.filter((event) =>
    hiddenEvents.has(getEventId(event))
  );

  let planText = '';

  if (interestedEventsData.length > 0) {
    planText += '=== INTERESTED EVENTS ===\n\n';
    planText += interestedEventsData
      .map((event) => {
        const endTime = calculateEndTime(
          event.time,
          event.durationMinutes || 0
        );
        return `${event.day} ${event.date} | ${event.time}-${endTime} | ${
          event.venue
        }\n${event.event}\n${event.movie || 'N/A'}\n---`;
      })
      .join('\n\n');
  }

  if (selectedEventsData.length > 0) {
    if (planText) planText += '\n\n\n';
    planText += '=== SELECTED EVENTS ===\n\n';
    planText += selectedEventsData
      .map((event) => {
        const endTime = calculateEndTime(
          event.time,
          event.durationMinutes || 0
        );
        return `${event.day} ${event.date} | ${event.time}-${endTime} | ${
          event.venue
        }\n${event.event}\n${event.movie || 'N/A'}\n---`;
      })
      .join('\n\n');
  }

  if (hiddenEventsData.length > 0) {
    if (planText) planText += '\n\n\n';
    planText += '=== HIDDEN EVENTS ===\n\n';
    planText += hiddenEventsData
      .map((event) => {
        const endTime = calculateEndTime(
          event.time,
          event.durationMinutes || 0
        );
        return `${event.day} ${event.date} | ${event.time}-${endTime} | ${
          event.venue
        }\n${event.event}\n${event.movie || 'N/A'}\n---`;
      })
      .join('\n\n');
  }

  if (!planText) {
    planText = 'No events marked as interested, selected, or hidden.';
  }

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
  const totalEvents =
    interestedEventsData.length +
    selectedEventsData.length +
    hiddenEventsData.length;
  const successMsg = document.createElement('div');
  successMsg.className = 'success';
  successMsg.textContent = `✅ Exported ${totalEvents} events to your plan! (${interestedEventsData.length} interested, ${selectedEventsData.length} selected, ${hiddenEventsData.length} hidden)`;
  document.querySelector('.controls-section').appendChild(successMsg);
  setTimeout(() => successMsg.remove(), 3000);
}

function exportMyPlanJSON() {
  const exportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    interested: Array.from(interestedEvents),
    selected: Array.from(selectedEvents),
    hidden: Array.from(hiddenEvents),
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'festival-plan.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Show success message
  const totalEvents = interestedEvents.size + selectedEvents.size;
  const successMsg = document.createElement('div');
  successMsg.className = 'success';
  successMsg.textContent = `✅ Exported ${totalEvents} events as JSON! (${interestedEvents.size} interested, ${selectedEvents.size} selected, ${hiddenEvents.size} hidden)`;
  document.querySelector('.controls-section').appendChild(successMsg);
  setTimeout(() => successMsg.remove(), 3000);
}

function importMyPlan() {
  const fileInput = document.getElementById('importFileInput');
  fileInput.click();
}

function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const content = e.target.result;

      // Determine file type and parse accordingly
      if (file.name.endsWith('.json')) {
        parseImportedJSON(content);
      } else {
        parseImportedPlan(content);
      }
    } catch (error) {
      showImportError('Error reading file: ' + error.message);
    }
  };
  reader.readAsText(file);

  // Reset file input so same file can be imported again
  event.target.value = '';
}

function parseImportedPlan(content) {
  try {
    // Clear current selections
    const previousInterested = interestedEvents.size;
    const previousSelected = selectedEvents.size;
    const previousHidden = hiddenEvents.size;

    interestedEvents.clear();
    selectedEvents.clear();
    hiddenEvents.clear();

    // Parse the exported format
    const sections = content.split('=== ');
    let importedInterested = 0;
    let importedSelected = 0;
    let importedHidden = 0;

    sections.forEach((section) => {
      if (section.startsWith('INTERESTED EVENTS ===')) {
        const events = parseEventSection(section, 'interested');
        importedInterested = events.length;
      } else if (section.startsWith('SELECTED EVENTS ===')) {
        const events = parseEventSection(section, 'selected');
        importedSelected = events.length;
      } else if (section.startsWith('HIDDEN EVENTS ===')) {
        const events = parseEventSection(section, 'hidden');
        importedHidden = events.length;
      }
    });

    // Update UI
    updateEventVisibility();
    updateCounts();
    saveUserPreferences();

    // Show success message
    const successMsg = document.createElement('div');
    successMsg.className = 'success';
    successMsg.innerHTML = `
      ✅ Plan imported successfully!<br>
      📥 Imported: ${importedInterested} interested, ${importedSelected} selected, ${importedHidden} hidden<br>
      🔄 Replaced: ${previousInterested} interested, ${previousSelected} selected, ${previousHidden} hidden
    `;
    document.querySelector('.controls-section').appendChild(successMsg);
    setTimeout(() => successMsg.remove(), 5000);
  } catch (error) {
    showImportError('Error parsing plan: ' + error.message);
  }
}

function parseImportedJSON(content) {
  try {
    const data = JSON.parse(content);

    // Validate JSON structure
    if (!data.version || (!data.interested && !data.selected)) {
      throw new Error('Invalid JSON format. Expected festival plan export.');
    }

    // Clear current selections
    const previousInterested = interestedEvents.size;
    const previousSelected = selectedEvents.size;
    const previousHidden = hiddenEvents.size;

    interestedEvents.clear();
    selectedEvents.clear();
    hiddenEvents.clear();

    // Import data
    if (data.interested) {
      data.interested.forEach((eventId) => interestedEvents.add(eventId));
    }
    if (data.selected) {
      data.selected.forEach((eventId) => selectedEvents.add(eventId));
    }
    if (data.hidden) {
      data.hidden.forEach((eventId) => hiddenEvents.add(eventId));
    }

    // Update UI
    updateEventVisibility();
    updateCounts();
    saveUserPreferences();

    // Show success message
    const successMsg = document.createElement('div');
    successMsg.className = 'success';
    successMsg.innerHTML = `
      ✅ JSON plan imported successfully!<br>
      📥 Imported: ${interestedEvents.size} interested, ${selectedEvents.size} selected, ${hiddenEvents.size} hidden<br>
      🔄 Replaced: ${previousInterested} interested, ${previousSelected} selected, ${previousHidden} hidden
    `;
    document.querySelector('.controls-section').appendChild(successMsg);
    setTimeout(() => successMsg.remove(), 5000);
  } catch (error) {
    showImportError('Invalid JSON format: ' + error.message);
  }
}

function parseEventSection(section, type) {
  const events = [];
  const lines = section.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Look for event lines in format: "Day Date | Time-Time | Venue"
    if (line.includes(' | ') && line.includes('-') && !line.startsWith('===')) {
      const parts = line.split(' | ');
      if (parts.length >= 3) {
        const dayDate = parts[0].trim();
        const timeRange = parts[1].trim();
        const venue = parts[2].trim();

        // Extract day and date
        const dayDateParts = dayDate.split(' ');
        if (dayDateParts.length >= 2) {
          const day = dayDateParts[0];
          const date = dayDateParts[1];
          const startTime = timeRange.split('-')[0];

          // Get event name from next line
          if (i + 1 < lines.length) {
            const eventName = lines[i + 1].trim();
            if (
              eventName &&
              eventName !== '---' &&
              !eventName.startsWith('===')
            ) {
              // Find matching event in parsed data
              const matchingEvent = parsedData.find(
                (event) =>
                  event.day === day &&
                  event.date.toString() === date &&
                  event.time === startTime &&
                  event.venue === venue &&
                  event.event === eventName
              );

              if (matchingEvent) {
                const eventId = getEventId(matchingEvent);
                if (type === 'interested') {
                  interestedEvents.add(eventId);
                } else if (type === 'selected') {
                  selectedEvents.add(eventId);
                } else if (type === 'hidden') {
                  hiddenEvents.add(eventId);
                }
                events.push(matchingEvent);
              }
            }
          }
        }
      }
    }
  }

  return events;
}

function showImportError(message) {
  const errorMsg = document.createElement('div');
  errorMsg.className = 'error';
  errorMsg.innerHTML = `❌ Import failed: ${message}`;
  document.querySelector('.controls-section').appendChild(errorMsg);
  setTimeout(() => errorMsg.remove(), 5000);
}

function calculateEndTime(startTime, durationMinutes) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + durationMinutes;
  const endHours = Math.floor(endMinutes / 60) % 24; // Handle 24-hour rollover
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
  const hours = Math.floor(minutes / 60) % 24; // Handle 24-hour rollover
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins
    .toString()
    .padStart(2, '0')}`;
}

function generateTimeSlots(events) {
  // Find the earliest and latest times for the day
  let earliestTime = 24 * 60; // Start with end of day
  let latestTime = 0; // Start with beginning of day

  events.forEach((event) => {
    if (event.time && event.durationMinutes) {
      const startMinutes = timeToMinutes(event.time);
      const endMinutes = startMinutes + event.durationMinutes;

      earliestTime = Math.min(earliestTime, startMinutes);
      latestTime = Math.max(latestTime, endMinutes);
    }
  });

  // If no events found, return empty array
  if (earliestTime === 24 * 60) {
    return [];
  }

  // Round down earliest time to nearest 15-minute mark
  const startHour = Math.floor(earliestTime / 60);
  const startMinute = Math.floor((earliestTime % 60) / 15) * 15;
  const roundedEarliestTime = startHour * 60 + startMinute;

  // Round up latest time to nearest 15-minute mark
  const endHour = Math.floor(latestTime / 60);
  const endMinute = Math.ceil((latestTime % 60) / 15) * 15;
  const roundedLatestTime = endHour * 60 + (endMinute >= 60 ? 60 : endMinute);

  // Generate regular 15-minute intervals
  const timeSlots = [];
  for (let time = roundedEarliestTime; time <= roundedLatestTime; time += 15) {
    timeSlots.push(time);
  }

  return timeSlots;
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

        // Find the time slot where this event should be placed
        // Place it in the slot that contains or comes after the event start time
        const startSlot =
          timeSlots.find((slot) => slot >= startMinutes) || timeSlots[0];
        if (startSlot !== undefined) {
          grid[startSlot][event.venue] = event;
        }

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
          // Calculate how many 15-minute slots this event spans
          const eventDurationMinutes = event.durationMinutes || 0;
          const slotsSpanned = Math.ceil(eventDurationMinutes / 15);

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
                                <button class="event-btn btn-selected" onclick="toggleEventSelected('${escapedEventId}')" title="Mark as selected">✓</button>
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
  const interestedEventsData = events.filter((e) =>
    interestedEvents.has(getEventId(e))
  );
  const selectedEventsData = events.filter((e) =>
    selectedEvents.has(getEventId(e))
  );
  const myEvents = [...interestedEventsData, ...selectedEventsData];

  const stats = {
    totalEvents: events.length,
    visibleEvents: visibleEvents.length,
    interestedEvents: interestedEventsData.length,
    selectedEvents: selectedEventsData.length,
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
                <div class="stat-number" style="color: #007bff;">${stats.interestedEvents}</div>
                <div class="stat-label">⭐ Interested</div>
            </div>
            <div class="stat-item">
                <div class="stat-number" style="color: #28a745;">${stats.selectedEvents}</div>
                <div class="stat-label">✓ Selected</div>
            </div>
            <div class="stat-item">
                <div class="stat-number" style="color: #6f42c1;">${stats.myEvents}</div>
                <div class="stat-label">Total Planned</div>
            </div>
            <div class="stat-item">
                <div class="stat-number" style="color: #fd7e14;">${stats.myHours}h</div>
                <div class="stat-label">My Festival Hours</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${stats.totalDays}</div>
                <div class="stat-label">Festival Days</div>
            </div>
        </div>
    `;
}

function displayCalendar() {
  document.getElementById('stats').innerHTML = generateStats(parsedData);
  document.getElementById('calendar').innerHTML =
    createCalendarGrid(parsedData);

  // Apply saved preferences to the newly created DOM elements
  setTimeout(() => {
    updateEventVisibility();
    updateCounts();
  }, 0);
}

// PWA Install functionality
let deferredPrompt;

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);

        // Check for updates every time the page loads
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New service worker is available, show update notification
              showUpdateNotification();
            }
          });
        });

        // Check for updates immediately
        registration.update();
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

function showUpdateNotification() {
  const updateBanner = document.createElement('div');
  updateBanner.className = 'controls-section';
  updateBanner.style.background = '#fff3cd';
  updateBanner.style.borderLeftColor = '#ffc107';
  updateBanner.innerHTML = `
    <div class="controls-row">
      <span>🔄 <strong>Update Available:</strong> A new version of the app is ready!</span>
      <button onclick="updateApp()" style="background: #ffc107; color: #000;">🔄 Update Now</button>
      <button onclick="dismissUpdate()" class="secondary" style="font-size: 12px; padding: 4px 8px;">Later</button>
    </div>
  `;
  updateBanner.id = 'updateBanner';
  document
    .querySelector('.container')
    .insertBefore(
      updateBanner,
      document.querySelector('.container').firstChild
    );
}

function updateApp() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    });
  }
}

function dismissUpdate() {
  const updateBanner = document.getElementById('updateBanner');
  if (updateBanner) {
    updateBanner.remove();
  }
}

// Handle PWA install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  // Show install prompt
  document.getElementById('installPrompt').style.display = 'block';
});

function installApp() {
  if (deferredPrompt) {
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      deferredPrompt = null;
      document.getElementById('installPrompt').style.display = 'none';
    });
  }
}

function dismissInstallPrompt() {
  document.getElementById('installPrompt').style.display = 'none';
  deferredPrompt = null;
}

// Initialize
window.onload = function () {
  loadScheduleData();
};
