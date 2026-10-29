# Spec Delta

## ADDED Requirements

### Requirement: Limit light command rate
The system SHALL send at most one command per 100 ms to the same light. When the user changes a light faster, the system SHALL send only the latest value once the 100 ms have passed. Each light has its own limit.

#### Scenario: Quick changes
- **WHEN** the user changes the brightness of "Ceiling" three times within 100 ms
- **THEN** the bridge receives the first change at once and the last change after 100 ms
- **AND** the middle change is never sent

#### Scenario: Different lights
- **WHEN** the user changes "Ceiling" and "Counter" at the same time
- **THEN** the bridge receives both changes at once
