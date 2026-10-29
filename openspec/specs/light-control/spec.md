# light-control Specification

## Purpose

Lets the user see and control the single lights inside a room or zone, so one lamp can differ from the rest of the group.

## Requirements

### Requirement: Open a room or zone
Selecting a room or zone in the sidebar SHALL open its detail page at `/rooms/<id>` or `/zones/<id>`. The page SHALL show the group's name, how many of its lights are on and how many are unreachable, the group controls, its scenes, and every light in the group, sorted by name.

#### Scenario: Open the kitchen
- **WHEN** the user selects "Kitchen" in the sidebar
- **THEN** the Kitchen detail page opens and lists the Kitchen's lights

#### Scenario: Unreachable light in the header
- **WHEN** a room has 3 lights, 2 of them on and 1 unreachable
- **THEN** its page header says "2 of 3 lights on · 1 unreachable"

#### Scenario: Unknown group
- **WHEN** the user opens `/rooms/<id>` for an id the bridge does not know
- **THEN** the page says the room was not found and the sidebar still lists the other rooms

### Requirement: Light state
Each light on a detail page SHALL show as a card with its name, whether it is on, and its brightness in percent when it supports dimming.

#### Scenario: Dimmable light
- **WHEN** the "Ceiling" light is on at 70 %
- **THEN** its card shows it as on with brightness 70 %

#### Scenario: Light without dimming
- **WHEN** a light does not support dimming (for example a smart plug)
- **THEN** its card shows only the on/off switch

### Requirement: Control a single light
The system SHALL let the user switch a single light on or off and, if it supports dimming, set its brightness from 1 to 100 percent when the slider is released. The same optimistic update and error handling as for groups SHALL apply.

#### Scenario: Turn one light off
- **WHEN** the user switches off "Ceiling" in the Kitchen
- **THEN** the bridge receives a command for that light only
- **AND** the other Kitchen lights keep their state

#### Scenario: Unreachable light
- **WHEN** the bridge reports that a light is unreachable (for example powered off at the wall)
- **THEN** the light's row says it is unreachable and its controls are disabled

### Requirement: Limit light command rate
The system SHALL send at most one command per 100 ms to the same light. When the user changes a light faster, the system SHALL send only the latest value once the 100 ms have passed. Each light has its own limit.

#### Scenario: Quick changes
- **WHEN** the user changes the brightness of "Ceiling" three times within 100 ms
- **THEN** the bridge receives the first change at once and the last change after 100 ms
- **AND** the middle change is never sent

#### Scenario: Different lights
- **WHEN** the user changes "Ceiling" and "Counter" at the same time
- **THEN** the bridge receives both changes at once
