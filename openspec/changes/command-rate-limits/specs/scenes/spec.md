# Spec Delta

## ADDED Requirements

### Requirement: Limit scene recall rate
The system SHALL send at most one recall per second for the same scene. When the user recalls a scene again within the second, the system SHALL send only the latest recall once the second has passed.

#### Scenario: Recall twice quickly
- **WHEN** the user selects "Tropical" and then plays it within one second
- **THEN** the bridge receives the first recall at once and the dynamic recall after the second has passed
