# Spec Delta

## MODIFIED Requirements

### Requirement: Set group color temperature
On the room or zone detail page, the system SHALL offer a color temperature control when at least one light in the group supports color temperature. The control's range SHALL cover only the range those lights support, and the server SHALL clamp a group command to that range.

#### Scenario: Warm white
- **WHEN** the user sets the Living room color temperature to the warm end
- **THEN** the bridge receives a command with the warmest supported color temperature for the group

#### Scenario: Value outside the range
- **WHEN** a command asks for a warmer white than any Living room light supports
- **THEN** the bridge receives the warmest color temperature that a Living room light supports

#### Scenario: No light supports color temperature
- **WHEN** no light in the group supports color temperature
- **THEN** the color temperature control is not shown

### Requirement: Limit group command rate
The system SHALL send at most one command per second to the same room or zone. When the user changes a group faster, the system SHALL wait until the second has passed and then send one command with the latest value of each changed property.

#### Scenario: Quick changes
- **WHEN** the user changes Kitchen brightness three times within one second
- **THEN** the bridge receives the first change at once and the last change after the second has passed
- **AND** the middle change is never sent

#### Scenario: Different properties
- **WHEN** the user switches the Kitchen on, then sets its white, then its brightness, within one second
- **THEN** the bridge receives the switch at once
- **AND** one command with both the white and the brightness after the second has passed

### Requirement: Refresh state without polling
The system SHALL update rooms, zones, and lights from the bridge's live updates instead of reloading after each command or when the browser tab becomes visible again. The system SHALL NOT poll the bridge on a timer.

#### Scenario: Back to the tab
- **WHEN** the user returns to the huedash tab after switching a light in the Hue app
- **THEN** the page shows the new state without a manual reload
- **AND** the bridge receives no request because the tab became visible

#### Scenario: Own command
- **WHEN** the user switches the Kitchen off in huedash
- **THEN** the page does not reload its data
- **AND** the switch stays off once the bridge reports the change
