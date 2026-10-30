# home-state Specification

## Purpose
Defines the server's single copy of the Hue home: how it is loaded from the bridge, kept current, checked, and used to answer page loads without extra bridge requests.

## Requirements

### Requirement: One copy of the home on the server
While a bridge is configured, the server SHALL keep one copy of the bridge's rooms, zones, devices, lights, groups, connectivity, and scenes. It SHALL load the copy from the bridge once and then keep it current from the bridge event stream, including additions, removals, and renames.

#### Scenario: Light renamed in the Hue app
- **WHEN** the user renames "Ceiling" to "Pendant" in the Hue app
- **THEN** the server copy shows "Pendant" without loading all resources again

#### Scenario: Room added
- **WHEN** the bridge reports a new room "Office"
- **THEN** the server copy lists "Office" without loading all resources again

### Requirement: Page loads use the server copy
A page load SHALL read the home from the server copy and SHALL NOT send a request to the bridge while the copy is current. When no current copy exists, the server SHALL load it from the bridge once and share that load between all waiting requests.

#### Scenario: Two page loads
- **WHEN** the copy is current and two tabs load the Kitchen page
- **THEN** the bridge receives no requests for these loads

#### Scenario: First load after start
- **WHEN** the server has just started and three tabs load pages at the same time
- **THEN** the bridge receives each resource request once

#### Scenario: Bridge unreachable on load
- **WHEN** no current copy exists and the bridge does not answer
- **THEN** the page shows that the bridge is not reachable, with a retry

### Requirement: Reload the copy after a lost stream
When the bridge event stream reconnects, the server SHALL load all resources from the bridge again, apply the events that arrived during that load, and then send the result to open tabs.

#### Scenario: Bridge restarts
- **WHEN** the bridge restarts and a light was renamed while the stream was down
- **THEN** after the stream is back, open tabs show the new name

### Requirement: Check bridge data
The server SHALL check every resource from bridge responses and events against the fields huedash uses. A resource that does not match SHALL be skipped and logged, and SHALL NOT fail the page or the other resources.

#### Scenario: Unexpected light data
- **WHEN** the bridge reports one light without a name
- **THEN** the page shows the other lights
- **AND** the server log names the skipped light id

#### Scenario: Malformed event
- **WHEN** the bridge sends an event that is not valid JSON or has an unknown shape
- **THEN** the server ignores it and the copy keeps its previous state

### Requirement: Clear the copy when the bridge is forgotten
When the user forgets the bridge, the server SHALL close the bridge event stream and drop the copy.

#### Scenario: Forget the bridge
- **WHEN** the user forgets the bridge in settings
- **THEN** the server closes the bridge event stream
- **AND** a later pairing with another bridge shows only that bridge's rooms

### Requirement: Reject commands for unknown targets
The server SHALL answer a command for a light, room, zone, or scene that is not in the copy with "not found" and SHALL NOT send it to the bridge.

#### Scenario: Removed light
- **WHEN** a tab sends a command for a light that was removed from the bridge
- **THEN** the server answers "not found" and the bridge receives no command
