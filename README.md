# Festival Schedule Planner

A web-based festival schedule planner that helps you organize and plan your festival experience. Originally designed for the Sitges Film Festival, this tool allows you to browse events, mark favorites, hide unwanted events, and export your personal schedule.

## Features

- **Interactive Schedule Grid**: Visual timeline showing all events across multiple venues
- **Personal Planning**: Mark events as interested (⭐) or hide them (❌)
- **Smart Filtering**: Show all events or filter to only your interested events
- **Export Functionality**: Download your personal plan as a text file
- **Responsive Design**: Works on desktop and mobile devices
- **Local Storage**: Your preferences are saved automatically

## Project Structure

```
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # All CSS styles
├── js/
│   └── planner.js      # JavaScript functionality
├── data/
│   └── schedule.json   # Festival schedule data
└── README.md           # This file
```

## Getting Started

### Prerequisites

Since the app loads data via fetch API, you need to serve it from a web server (not just open the HTML file directly).

### Running the Application

1. **Using Python (recommended)**:

   ```bash
   python -m http.server 8000
   ```

   Then open http://localhost:8000

2. **Using Node.js**:

   ```bash
   npx serve .
   ```

3. **Using any other web server** of your choice

### Installing as a Mobile App (PWA)

This app is a Progressive Web App that can be installed on your phone for offline use:

#### Android:

1. Open the app in Chrome browser
2. Look for the "Install App" prompt at the top
3. Tap "Install" or use Chrome's menu → "Add to Home Screen"
4. The app will be added to your home screen and work offline

#### iOS:

1. Open the app in Safari
2. Tap the Share button (square with arrow)
3. Select "Add to Home Screen"
4. Confirm to add the app icon

#### Desktop:

1. Open the app in Chrome, Edge, or Firefox
2. Look for the install icon in the address bar
3. Click to install as a desktop app

### Offline Usage

Once installed, the app works completely offline:

- All your event preferences are saved locally
- Schedule data is cached for offline viewing
- Full functionality available without internet connection

### Updating the Schedule Data

To use this planner for a different festival:

1. Replace the content in `data/schedule.json` with your festival data
2. Ensure the JSON follows this structure:
   ```json
   [
     {
       "day": "Thursday",
       "date": 9,
       "time": "08:30",
       "event": "Event Name",
       "movie": "Movie Title",
       "venue": "Venue Name",
       "duration": "105'",
       "movies": ["Movie Title"],
       "sections": ["Section Name"],
       "special_tags": ["Presència", "Q&A"]
     }
   ]
   ```

## Usage

### Planning Your Festival

1. **Browse Events**: Scroll through the schedule to see all available events
2. **Mark Events**:
   - Click ⭐ for events you're **interested** in (might attend)
   - Click ✓ for events you've **selected** (definitely attending)
   - Click ❌ to **hide** events you're not interested in
3. **Manage Events**:
   - Click buttons again to toggle states
   - Use "Show Hidden" to review and unhide events
4. **Filter Views**:
   - "Show All" - See everything
   - "Show Interested" - Only ⭐ events
   - "Show Selected" - Only ✓ events
   - "Show Hidden" - Review hidden events
5. **Export Plan**: Download your interested and selected events

### Understanding the Interface

- **Blue Events**: Available events you haven't marked
- **Yellow Events with Orange Border**: ⭐ Events you're interested in (might attend)
- **Green Events with Teal Border**: ✓ Events you've selected (definitely attending)
- **Purple Events**: Events with multiple movies
- **Gray Events**: ❌ Hidden events (use "Show Hidden" to manage them)
- **Tooltips**: Hover over events for detailed information

### Event States

The planner supports three main states for better organization:

1. **Interested (⭐)** - Events you might want to attend, need to decide
2. **Selected (✓)** - Events you've committed to attending
3. **Hidden (❌)** - Events you're not interested in

Each event can only be in one state at a time. States are mutually exclusive to keep your planning clear and organized.

### Unhiding Events

You have several options to unhide events:

1. **Individual Unhide**: Use "Show Hidden" button, then click the ❌ button on any hidden event to unhide it
2. **Bulk Unhide**: Click "Unhide All" button to restore all hidden events at once
3. **Toggle Visibility**: The ❌ button works as a toggle - click once to hide, click again to unhide

## Customization

### Styling

Edit `css/styles.css` to customize:

- Colors and themes
- Layout and spacing
- Responsive breakpoints
- Print styles

### Functionality

Edit `js/planner.js` to modify:

- Data processing logic
- Event filtering
- Export format
- User interface behavior

### Data Format

The schedule data supports:

- Multiple movies per event
- Special tags (presence, Q&A, etc.)
- Festival sections/categories
- Venue information
- Duration and timing

## Browser Compatibility

- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge
- Mobile browsers

## Contributing

Feel free to fork this project and adapt it for your own festivals or events. The modular structure makes it easy to customize for different use cases.

## License

This project is open source and available under the MIT License.
