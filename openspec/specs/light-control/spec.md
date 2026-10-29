# light-control Specification

## Purpose

Lets the user see and control the single lights inside a room or zone, so one lamp can differ from the rest of the group.

## Requirements

### Requirement: Open a room or zone
Selecting a room or zone on the home page SHALL open its detail page at `/rooms/<id>` or `/zones/<id>`. The page SHALL show the group controls and every light in the group, sorted by name.

#### Scenario: Open the kitchen
- **WHEN** the user selects "Kitchen" on the home page
- **THEN** the Kitchen detail page opens and lists the Kitchen's lights

#### Scenario: Unknown group
- **WHEN** the user opens `/rooms/<id>` for an id the bridge does not know
- **THEN** the page says the room was not found and links back to the home page

### Requirement: Light state
Each light on a detail page SHALL show its name, whether it is on, and its brightness in percent when it supports dimming.

#### Scenario: Dimmable light
- **WHEN** the "Ceiling" light is on at 70 %
- **THEN** its row shows it as on with brightness 70 %

#### Scenario: Light without dimming
- **WHEN** a light does not support dimming (for example a smart plug)
- **THEN** its row shows only the on/off switch

### Requirement: Control a single light
The system SHALL let the user switch a single light on or off and, if it supports dimming, set its brightness from 1 to 100 percent when the slider is released. The same optimistic update and error handling as for groups SHALL apply.

#### Scenario: Turn one light off
- **WHEN** the user switches off "Ceiling" in the Kitchen
- **THEN** the bridge receives a command for that light only
- **AND** the other Kitchen lights keep their state

#### Scenario: Unreachable light
- **WHEN** the bridge reports that a light is unreachable (for example powered off at the wall)
- **THEN** the light's row says it is unreachable and its controls are disabled
