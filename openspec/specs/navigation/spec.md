# navigation Specification

## Purpose
Defines the app shell: the sidebar that lists every room and zone, what `/` opens, and how the layout adapts to the screen width, so users can move between rooms in one step.

## Requirements

### Requirement: Sidebar on every page
Every page except setup SHALL show a sidebar with the list of rooms and zones, the bridge connection state, and a link to settings. The entry of the open room or zone SHALL be marked as current.

#### Scenario: Move between rooms
- **WHEN** the Kitchen page is open
- **AND** the user selects "Living room" in the sidebar
- **THEN** the Living room page opens without passing through another page
- **AND** the sidebar marks "Living room" as current

#### Scenario: Settings page
- **WHEN** the user opens `/settings`
- **THEN** the sidebar is shown and no entry is marked as current

#### Scenario: Setup
- **WHEN** no bridge is paired and the setup page is open
- **THEN** no sidebar is shown

### Requirement: Open the first room
Opening `/` SHALL open the first room in sidebar order. Without rooms it SHALL open the first zone. Without rooms and zones, `/` SHALL show that no rooms are set up yet, inside the shell.

#### Scenario: Rooms present
- **WHEN** the bridge has rooms "Kitchen" and "Living room"
- **AND** the user opens `/`
- **THEN** the Kitchen page opens at `/rooms/<kitchen id>`

#### Scenario: Only zones
- **WHEN** the bridge has no rooms and a zone "Downstairs"
- **AND** the user opens `/`
- **THEN** the Downstairs page opens

### Requirement: Sidebar on small screens
On screens narrower than 768 px the sidebar SHALL be hidden behind a menu button in a top bar that also shows the page title. Selecting an entry SHALL open the page and close the sidebar.

#### Scenario: Phone
- **WHEN** the Kitchen page is open on a screen 390 px wide
- **THEN** the sidebar is hidden and the top bar shows a menu button and "Kitchen"

#### Scenario: Pick a room on a phone
- **WHEN** the user opens the menu on a phone and selects "Living room"
- **THEN** the Living room page opens and the sidebar closes

### Requirement: Home summary
The sidebar header SHALL show how many lights in the home are on, counting each light once even when it is in several rooms or zones, and counting only reachable lights as on. It SHALL follow live updates.

#### Scenario: Some lights on
- **WHEN** the home has 4 lights and 3 of them are on and reachable
- **THEN** the sidebar header says "3 of 4 lights on"

#### Scenario: Light in a room and a zone
- **WHEN** "Ceiling" is in the Kitchen and in the zone Downstairs
- **THEN** the home summary counts "Ceiling" once

#### Scenario: Live change
- **WHEN** another light turns on in the Hue app
- **THEN** the home summary counts it without a reload

### Requirement: Room page layout
Room and zone pages SHALL show the room header at the top, then the scenes and the lights at the full width of the page column. On screens 768 px and wider the header SHALL stay at the top of the page column while the page scrolls. On narrower screens it SHALL scroll with the page.

#### Scenario: Wide screen
- **WHEN** the Kitchen page is open on a screen 1440 px wide
- **THEN** the sidebar is on the left, and the header, scenes, and lights are in one column next to it

#### Scenario: Sticky header
- **WHEN** the Kitchen page is open on a screen 1024 px wide and the user scrolls down to the lights
- **THEN** the header with the switch and brightness slider stays visible at the top

#### Scenario: Phone
- **WHEN** the Kitchen page is open on a screen 390 px wide and the user scrolls down
- **THEN** the header scrolls out of view

### Requirement: Control dialog
The control dialog for a room, zone, or light SHALL open centered over the page on screens 768 px and wider, and as a bottom sheet on narrower screens. White and color SHALL be two tabs when both are available. Closing the dialog SHALL keep the page's scroll position.

#### Scenario: Wide screen
- **WHEN** the user opens the "Ceiling" dialog on a screen 1440 px wide
- **THEN** the dialog shows centered over the page

#### Scenario: Phone
- **WHEN** the user taps the "Ceiling" card on a screen 390 px wide, scrolled to the lights
- **THEN** a bottom sheet opens with the controls for "Ceiling"
- **AND** after closing it, the page keeps its scroll position

#### Scenario: White and color
- **WHEN** the Kitchen supports color temperature and color and the user opens its dialog
- **THEN** the dialog shows a White tab and a Color tab
