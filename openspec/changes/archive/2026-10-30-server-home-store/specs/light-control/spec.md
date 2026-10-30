# Spec Delta

## MODIFIED Requirements

### Requirement: Limit light command rate
The system SHALL send at most one command per 100 ms to the same light. When the user changes a light faster, the system SHALL wait until the 100 ms have passed and then send one command with the latest value of each changed property. Each light has its own limit.

#### Scenario: Quick changes
- **WHEN** the user changes the brightness of "Ceiling" three times within 100 ms
- **THEN** the bridge receives the first change at once and the last change after 100 ms
- **AND** the middle change is never sent

#### Scenario: Different properties
- **WHEN** the user switches "Ceiling" on, then sets its color, then its brightness, within 100 ms
- **THEN** the bridge receives the switch at once
- **AND** one command with both the color and the brightness after 100 ms

#### Scenario: Different lights
- **WHEN** the user changes "Ceiling" and "Counter" at the same time
- **THEN** the bridge receives both changes at once

## ADDED Requirements

### Requirement: Keep white in the light's range
The server SHALL clamp the color temperature of a light command to the range that light supports.

#### Scenario: Warmer than supported
- **WHEN** a command asks "Ceiling" for 550 mirek and "Ceiling" supports 153 to 454 mirek
- **THEN** the bridge receives 454 mirek for "Ceiling"
