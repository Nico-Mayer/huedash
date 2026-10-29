# live-updates Specification

## Purpose

Shows changes to lights, rooms, and zones on open huedash pages as soon as the bridge reports them, whether they come from huedash, the Hue app, or a wall switch.

## Requirements

### Requirement: One shared bridge connection
While at least one browser tab listens for updates, the server SHALL hold exactly one event stream connection to the bridge and share it with all tabs. The server SHALL close the bridge connection when no tab has listened for 30 seconds.

#### Scenario: Three tabs open
- **WHEN** three browser tabs show huedash pages
- **THEN** the bridge has one event stream connection from huedash

#### Scenario: Last tab closed
- **WHEN** the last tab closes
- **AND** 30 seconds pass without a new tab
- **THEN** the server closes the bridge event stream connection

### Requirement: Show on/off and brightness changes in place
When the bridge reports a new on/off state or brightness for a light, room, or zone, or a new color temperature or color for a light, every open page that shows it SHALL update within one second, without reloading the page.

#### Scenario: Change in the Hue app
- **WHEN** the user turns the Kitchen off in the Hue app
- **THEN** the Kitchen switch in huedash shows off without a reload

#### Scenario: Change in another tab
- **WHEN** the user dims the Kitchen in one huedash tab
- **THEN** another open huedash tab shows the new Kitchen brightness

#### Scenario: Light color changes
- **WHEN** the dialog for "Ceiling" is open and the user sets it to red in the Hue app
- **THEN** the dialog shows the Color tab at red without a reload

### Requirement: Reload on structural changes
When the bridge reports a change that the page cannot apply in place (a room, zone, or light added, removed, or renamed, or a change in reachability), the system SHALL reload the page data once, at most once per second.

#### Scenario: Light becomes unreachable
- **WHEN** a lamp loses power at the wall and the bridge reports a connectivity change
- **THEN** the page reloads its data and shows the lamp as unreachable

### Requirement: Show lost connection
The system SHALL show a notice at the top of the page column while either the browser's connection to huedash or huedash's connection to the bridge is lost, and SHALL hide it when both are back. The sidebar footer SHALL show the same state. After the connection is back, the system SHALL reload the page data once, because changes may have been missed.

#### Scenario: Bridge stream drops
- **WHEN** the bridge closes the event stream
- **THEN** open pages show that live updates are reconnecting
- **AND** the sidebar footer says the bridge is reconnecting
- **AND** the notice disappears and the data reloads when the stream is back

#### Scenario: Phone
- **WHEN** the connection is lost on a screen narrower than 768 px
- **THEN** the notice shows at the top of the page while the sidebar is closed

### Requirement: Keep keys on the server
The event stream sent to the browser SHALL contain only the fields needed to update the page and SHALL NOT contain the app key, the client key, or raw bridge events.

#### Scenario: Browser stream content
- **WHEN** the browser receives an update
- **THEN** the update holds only a kind, an id, and on/off or brightness values

### Requirement: Show scene status changes in place
When the bridge reports that a scene became active, started playing dynamically, or became inactive, every open page that shows the scene or its room or zone SHALL update within one second, without reloading.

#### Scenario: Scene started in the Hue app
- **WHEN** the user starts "Relax" for the Kitchen in the Hue app
- **THEN** open huedash pages mark "Relax" as active without a reload

#### Scenario: Scene ends after a light change
- **WHEN** the bridge reports "Relax" as inactive
- **THEN** open pages no longer mark it as active
