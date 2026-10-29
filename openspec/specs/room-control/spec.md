# room-control Specification

## Purpose

Lets the user see all rooms and zones of their Hue system and control each one as a group: on/off, brightness, color temperature, and color.

## Requirements

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

### Requirement: Turn a room or zone on and off
The system SHALL let the user turn all lights of a room or zone on or off with one switch.

#### Scenario: Turn a room off
- **WHEN** the user switches "Kitchen" off
- **THEN** the bridge receives one command that turns the Kitchen group off
- **AND** the switch shows off immediately

### Requirement: Set group brightness
The system SHALL let the user set the brightness of a room or zone from 1 to 100 percent. The command SHALL be sent when the user releases the slider, not while dragging.

#### Scenario: Brightness released
- **WHEN** the user drags the Kitchen brightness slider and releases it at 40 %
- **THEN** the bridge receives one command setting the Kitchen group to 40 % brightness

### Requirement: Set group color temperature
On the room or zone detail page, the system SHALL offer a color temperature control when at least one light in the group supports color temperature. The control's range SHALL cover only the range those lights support.

#### Scenario: Warm white
- **WHEN** the user sets the Living room color temperature to the warm end
- **THEN** the bridge receives a command with the warmest supported color temperature for the group

#### Scenario: No light supports color temperature
- **WHEN** no light in the group supports color temperature
- **THEN** the color temperature control is not shown

### Requirement: Set group color
On the room or zone detail page, the system SHALL offer a color control with hue and saturation when at least one light in the group supports color. The system SHALL convert the chosen color to the bridge's CIE xy color space.

#### Scenario: Pick red
- **WHEN** the user picks hue 0 and full saturation for the Living room
- **THEN** the bridge receives a color command whose xy value matches sRGB red

#### Scenario: No color lights
- **WHEN** no light in the group supports color
- **THEN** the color control is not shown

### Requirement: Limit group command rate
The system SHALL send at most one command per second to the same room or zone. When the user changes a group faster, the system SHALL send only the latest value once the second has passed.

#### Scenario: Quick changes
- **WHEN** the user changes Kitchen brightness three times within one second
- **THEN** the bridge receives the first change at once and the last change after the second has passed
- **AND** the middle change is never sent

### Requirement: Show command results
The system SHALL show a change in the UI at once. When the bridge rejects the command or does not answer, the system SHALL restore the previous state and show an error naming the room or light.

#### Scenario: Bridge rejects a command
- **WHEN** the user switches "Kitchen" on and the bridge rejects the command
- **THEN** the switch returns to off
- **AND** a message says the Kitchen could not be changed

### Requirement: Refresh state without polling
The system SHALL update rooms, zones, and lights from the bridge's live updates instead of reloading after each command, and SHALL reload them when the browser tab becomes visible again. The system SHALL NOT poll the bridge on a timer.

#### Scenario: Back to the tab
- **WHEN** the user returns to the huedash tab after switching a light in the Hue app
- **THEN** the page shows the new state without a manual reload

#### Scenario: Own command
- **WHEN** the user switches the Kitchen off in huedash
- **THEN** the page does not reload its data
- **AND** the switch stays off once the bridge reports the change

### Requirement: Group presets
The group controls SHALL offer brightness presets 10, 25, 50, and 100 % and, when the color temperature control is shown, white presets Warm (2200 K), Soft (2700 K), Neutral (4000 K), and Daylight (6500 K), clamped to the group's range. A preset SHALL send one group command and turn the group on.

#### Scenario: Brightness preset
- **WHEN** no light is selected and the user selects 50 % in the Kitchen inspector
- **THEN** the bridge receives one command turning the Kitchen group on at 50 % brightness

#### Scenario: White preset
- **WHEN** no light is selected and the user selects Neutral in the Kitchen inspector
- **THEN** the bridge receives one command setting the Kitchen group to 250 mirek (4000 K)
