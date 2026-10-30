# live-updates Specification

## Purpose

Shows changes to lights, rooms, and zones on open huedash pages as soon as the bridge reports them, whether they come from huedash, the Hue app, or a wall switch.

## Requirements

### Requirement: One shared bridge connection
While a bridge is configured, the server SHALL hold exactly one event stream connection to the bridge and share it with all tabs. The server SHALL keep the connection open while no tab listens, and SHALL close it only when the bridge is forgotten or the configuration changes.

#### Scenario: Three tabs open
- **WHEN** three browser tabs show huedash pages
- **THEN** the bridge has one event stream connection from huedash

#### Scenario: Last tab closed
- **WHEN** the last tab closes
- **AND** 30 seconds pass without a new tab
- **THEN** the bridge event stream connection stays open
- **AND** the next page load shows the current state without a request to the bridge

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
- **THEN** the dialog's brightness slider fill turns red without a reload
- **AND** the color pad marker is at red when the user selects color

### Requirement: Show lost connection
The system SHALL show a notice at the top of the page column while either the browser's connection to huedash or huedash's connection to the bridge is lost, and SHALL hide it when both are back. The sidebar footer SHALL show the same state. After the connection is back, open pages SHALL show the current home without reloading the page data.

#### Scenario: Bridge stream drops
- **WHEN** the bridge closes the event stream
- **THEN** open pages show that live updates are reconnecting
- **AND** the sidebar footer says the bridge is reconnecting
- **AND** the notice disappears and the page shows the current state when the stream is back

#### Scenario: Browser connection drops
- **WHEN** the browser loses its connection to huedash and a light changes in the meantime
- **THEN** after the connection is back, the page shows the changed light without reloading its data

#### Scenario: Phone
- **WHEN** the connection is lost on a screen narrower than 768 px
- **THEN** the notice shows at the top of the page while the sidebar is closed

### Requirement: Keep keys on the server
The event stream sent to the browser SHALL contain only the home data the pages show and the connection status, and SHALL NOT contain the app key, the client key, or raw bridge events.

#### Scenario: Browser stream content
- **WHEN** the browser receives an update
- **THEN** the update holds the home data and the connection status only
- **AND** it contains no app key, no client key, and no bridge event

### Requirement: Show scene status changes in place
When the bridge reports that a scene became active, started playing dynamically, or became inactive, every open page that shows the scene or its room or zone SHALL update within one second, without reloading.

#### Scenario: Scene started in the Hue app
- **WHEN** the user starts "Relax" for the Kitchen in the Hue app
- **THEN** open huedash pages mark "Relax" as active without a reload

#### Scenario: Scene ends after a light change
- **WHEN** the bridge reports "Relax" as inactive
- **THEN** open pages no longer mark it as active

### Requirement: Show structural changes in place
When the bridge reports a room, zone, light, or scene added, removed, or renamed, or a change in reachability, every open page SHALL show the change within one second, without reloading the page data.

#### Scenario: Light becomes unreachable
- **WHEN** a lamp loses power at the wall and the bridge reports a connectivity change
- **THEN** open pages show the lamp as unreachable without reloading their data

#### Scenario: Room renamed
- **WHEN** the user renames "Kitchen" to "Cooking" in the Hue app
- **THEN** the sidebar and the open page show "Cooking" without reloading their data

#### Scenario: Open room removed
- **WHEN** the Kitchen page is open and the Kitchen is removed in the Hue app
- **THEN** the page says the room was not found and the sidebar no longer lists it

### Requirement: Show accepted commands in all tabs at once
When the bridge accepts a command from huedash, every open tab SHALL show the new state without waiting for the bridge to report it. A later report from the bridge SHALL replace it.

#### Scenario: Two tabs
- **WHEN** the user switches the Kitchen off in one tab and the bridge accepts the command
- **THEN** another open tab shows the Kitchen off before the bridge reports the change

#### Scenario: Scene started in huedash
- **WHEN** the user starts "Relax" in one tab and the bridge accepts the recall
- **THEN** every open tab marks "Relax" as active and the other Kitchen scenes as inactive

### Requirement: Reload tabs from an older version
When a tab connects to the live updates of a server that runs a different huedash version, the tab SHALL reload the page.

#### Scenario: Update while a tab is open
- **WHEN** the server is updated while a tab is open and the tab reconnects
- **THEN** the tab reloads and runs the new version
