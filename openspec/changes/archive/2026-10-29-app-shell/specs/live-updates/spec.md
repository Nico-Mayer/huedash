# Spec Delta

## MODIFIED Requirements

### Requirement: Show lost connection
The system SHALL show a notice at the top of the page column while either the browser's connection to huedash or huedash's connection to the bridge is lost, and SHALL hide it when both are back. The sidebar footer SHALL show the same state. After the connection is back, the system SHALL reload the page data once, because changes may have been missed.

#### Scenario: Bridge stream drops
- **WHEN** the bridge closes the event stream
- **THEN** open pages show that live updates are reconnecting
- **AND** the sidebar footer says the bridge is reconnecting
- **AND** the notice disappears and the data reloads when the stream is back

#### Scenario: Phone
- **WHEN** the connection is lost on a screen narrower than 768 px
- **THEN** the notice shows at the top of the page while the sidebar is closed
