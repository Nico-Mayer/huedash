# Spec Delta

## ADDED Requirements

### Requirement: Home summary
The sidebar header SHALL show how many lights in the home are on, counting each light once even when it is in several rooms or zones, and counting only reachable lights as on. It SHALL follow live updates.

#### Scenario: Some lights on
- **WHEN** the home has 4 lights and 3 of them are on and reachable
- **THEN** the sidebar header says "3 of 4 lights on"

#### Scenario: Light in a room and a zone
- **WHEN** "Ceiling" is in the Kitchen and in the zone Downstairs
- **THEN** the home summary counts "Ceiling" once

#### Scenario: Live change
- **WHEN** another light turns on in the Hue app
- **THEN** the home summary counts it without a reload
