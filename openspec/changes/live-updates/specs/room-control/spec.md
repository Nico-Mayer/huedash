# Spec Delta

## MODIFIED Requirements

### Requirement: Refresh state without polling
The system SHALL update rooms, zones, and lights from the bridge's live updates instead of reloading after each command, and SHALL reload them when the browser tab becomes visible again. The system SHALL NOT poll the bridge on a timer.

#### Scenario: Back to the tab
- **WHEN** the user returns to the huedash tab after switching a light in the Hue app
- **THEN** the page shows the new state without a manual reload

#### Scenario: Own command
- **WHEN** the user switches the Kitchen off in huedash
- **THEN** the page does not reload its data
- **AND** the switch stays off once the bridge reports the change
