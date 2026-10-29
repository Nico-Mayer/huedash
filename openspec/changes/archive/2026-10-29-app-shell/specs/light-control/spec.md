# Spec Delta

## MODIFIED Requirements

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
