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
The control dialog for a room, zone, or light SHALL open centered over the page on screens 768 px and wider, and as a bottom sheet on narrower screens. It SHALL show a value large at the top (white in kelvin while white is shown, otherwise brightness in percent), one large control below it, and a mode bar at the bottom. Closing the dialog SHALL keep the page's scroll position.

#### Scenario: Wide screen
- **WHEN** the user opens the "Ceiling" dialog on a screen 1440 px wide
- **THEN** the dialog shows centered over the page

#### Scenario: Phone
- **WHEN** the user taps the "Ceiling" card on a screen 390 px wide, scrolled to the lights
- **THEN** a bottom sheet opens with the controls for "Ceiling"
- **AND** after closing it, the page keeps its scroll position

#### Scenario: White and color
- **WHEN** the Kitchen supports color temperature and color and the user opens its dialog
- **THEN** the dialog shows the brightness control and a mode bar with power, brightness, color, and white

#### Scenario: Value at the top
- **WHEN** the "Ceiling" dialog shows brightness at 70 % and the user selects white at 2700 K
- **THEN** the value at the top changes from "70 %" to "2700 K"

#### Scenario: Color shows brightness
- **WHEN** the "Lamp" dialog is at 70 % and the user selects color
- **THEN** the value at the top stays "70 %"

#### Scenario: Off light
- **WHEN** the "Ceiling" dialog is open and "Ceiling" is off
- **THEN** the value at the top says "Off"

### Requirement: Dialog mode bar
The control dialog SHALL show a mode bar with a power button and one button per supported mode: brightness, color, and white. The power button SHALL show and switch the on/off state. Selecting a mode SHALL show its control. The selected mode SHALL be marked for screen readers. A target without any mode SHALL show only the power button.

#### Scenario: Selecting a mode
- **WHEN** the Kitchen dialog is open and the user selects color
- **THEN** the color pad shows and the color button is marked as selected

#### Scenario: Power button
- **WHEN** the "Ceiling" dialog is open, "Ceiling" is on, and the user selects the power button
- **THEN** the bridge receives a command turning "Ceiling" off
- **AND** the power button shows off

#### Scenario: Plug
- **WHEN** the user opens the dialog of a reachable smart plug
- **THEN** the mode bar shows only the power button

### Requirement: Switch pages without a bridge request
Moving between rooms, zones, and settings from the sidebar SHALL use the home the app already has, without a request to the server or the bridge. A room or zone id that does not exist SHALL still show that the room was not found.

#### Scenario: Move between rooms
- **WHEN** the Kitchen page is open
- **AND** the user selects "Living room" in the sidebar
- **THEN** the Living room page opens
- **AND** the browser sends no data request to the server

#### Scenario: Hover over a room
- **WHEN** the user moves the pointer over "Living room" in the sidebar
- **THEN** the bridge receives no request

#### Scenario: Live state kept
- **WHEN** "Ceiling" in the Kitchen was turned on in the Hue app while the Living room page was open
- **AND** the user opens the Kitchen page
- **THEN** the Kitchen page shows "Ceiling" on

#### Scenario: Unknown room
- **WHEN** the user opens `/rooms/unknown`
- **THEN** the page says the room was not found

### Requirement: Page transition
When the page changes inside the app shell, the page column SHALL cross-fade from the old page to the new one in at most 250 ms. The sidebar SHALL not move. When the browser asks for reduced motion, or does not support view transitions, the page SHALL change without a transition.

#### Scenario: Cross-fade
- **WHEN** the Kitchen page is open and the user selects "Living room"
- **THEN** the Kitchen page fades out while the Living room page fades in
- **AND** the sidebar stays still

#### Scenario: Reduced motion
- **WHEN** the browser prefers reduced motion and the user selects "Living room"
- **THEN** the Living room page replaces the Kitchen page without a transition
