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

### Requirement: Inspector for the open group
Room and zone pages SHALL show an inspector. Without a selection it SHALL control the whole group (on/off, brightness, white, color); with selected lights it SHALL control those lights. On screens 1280 px and wider the inspector SHALL be a column on the right; on narrower screens the group controls SHALL be at the top of the page and selected lights SHALL be controlled in a bottom sheet. White and color SHALL be two tabs when both are available.

#### Scenario: Wide screen
- **WHEN** the Kitchen page is open on a screen 1440 px wide
- **THEN** the sidebar, the scenes and lights, and the inspector are side by side

#### Scenario: Tablet
- **WHEN** the Kitchen page is open on a screen 1024 px wide
- **THEN** the sidebar is visible and the inspector is above the scenes

#### Scenario: White and color
- **WHEN** the group supports color temperature and color
- **THEN** the inspector shows the White tab selected and a Color tab

#### Scenario: Select a light on a narrow screen
- **WHEN** the Kitchen page is open on a screen 1024 px wide, scrolled to the lights
- **AND** the user taps the "Ceiling" card
- **THEN** a bottom sheet opens with the controls for "Ceiling"
- **AND** the page keeps its scroll position

#### Scenario: Select mode on a narrow screen
- **WHEN** the user is in select mode on a screen 390 px wide and has selected two lights
- **THEN** a bar shows "Control 2 lights", and selecting it opens the bottom sheet

#### Scenario: Close the sheet
- **WHEN** the bottom sheet is open and the user closes it
- **THEN** the selection is cleared

### Requirement: Sidebar on small screens
On screens narrower than 768 px the sidebar SHALL be hidden behind a menu button in a top bar that also shows the page title. Selecting an entry SHALL open the page and close the sidebar.

#### Scenario: Phone
- **WHEN** the Kitchen page is open on a screen 390 px wide
- **THEN** the sidebar is hidden and the top bar shows a menu button and "Kitchen"

#### Scenario: Pick a room on a phone
- **WHEN** the user opens the menu on a phone and selects "Living room"
- **THEN** the Living room page opens and the sidebar closes
