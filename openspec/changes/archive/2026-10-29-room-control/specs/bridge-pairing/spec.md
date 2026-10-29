# Spec Delta

## MODIFIED Requirements

### Requirement: Show connected bridge
When a bridge is configured, the settings page at `/settings` SHALL show the bridge name and whether the bridge is reachable right now. The home page SHALL link to the settings page.

#### Scenario: Bridge reachable
- **WHEN** a bridge is configured and answers an authenticated request
- **THEN** the settings page shows "Connected to <bridge name>"

#### Scenario: Bridge unreachable
- **WHEN** a bridge is configured but does not answer
- **THEN** the settings page shows the bridge name, says the bridge is not reachable, and offers a retry
