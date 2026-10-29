# Spec Delta

## MODIFIED Requirements

### Requirement: List rooms and zones
The sidebar SHALL list every room and every zone from the bridge, rooms first, each group sorted by name. Each entry SHALL show the name, an on/off switch for the group, a short state (the active scene's name, otherwise how many of its reachable lights are on ("3 of 5 on"), or "All off"), and up to three color dots for lights that are on.

#### Scenario: Rooms and zones present
- **WHEN** the bridge has rooms "Kitchen" and "Living room" and a zone "Downstairs"
- **THEN** the sidebar lists "Kitchen" and "Living room" under Rooms and "Downstairs" under Zones

#### Scenario: Entry state
- **WHEN** 2 of the 3 Kitchen lights are on and no Kitchen scene is active
- **THEN** the Kitchen entry shows "2 of 3 on" and its switch is on

#### Scenario: Group off
- **WHEN** all Living room lights are off
- **THEN** the Living room entry shows "All off", no color dots, and its switch is off

#### Scenario: Color dots
- **WHEN** "Ceiling" shows red and "Counter" a warm white, and both are on
- **THEN** the Kitchen entry shows a red dot and a warm white dot

#### Scenario: Nothing set up
- **WHEN** the bridge has no rooms and no zones
- **THEN** `/` says no rooms are set up yet and that rooms are created in the Hue app

#### Scenario: Bridge unreachable
- **WHEN** the bridge does not answer while a page loads
- **THEN** the page shows a notice that the bridge is not reachable, with a retry and a link to settings
