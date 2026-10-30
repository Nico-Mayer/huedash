# Spec Delta

## ADDED Requirements

### Requirement: Switch pages without a bridge request
Moving between rooms, zones, and settings from the sidebar SHALL use the home the app already has, without a request to the server or the bridge. A room or zone id that does not exist SHALL still show that the room was not found.

#### Scenario: Move between rooms
- **WHEN** the Kitchen page is open
- **AND** the user selects "Living room" in the sidebar
- **THEN** the Living room page opens
- **AND** the browser sends no data request to the server

#### Scenario: Hover over a room
- **WHEN** the user moves the pointer over "Living room" in the sidebar
- **THEN** the bridge receives no request

#### Scenario: Live state kept
- **WHEN** "Ceiling" in the Kitchen was turned on in the Hue app while the Living room page was open
- **AND** the user opens the Kitchen page
- **THEN** the Kitchen page shows "Ceiling" on

#### Scenario: Unknown room
- **WHEN** the user opens `/rooms/unknown`
- **THEN** the page says the room was not found

### Requirement: Page transition
When the page changes inside the app shell, the page column SHALL cross-fade from the old page to the new one in at most 250 ms. The sidebar SHALL not move. When the browser asks for reduced motion, or does not support view transitions, the page SHALL change without a transition.

#### Scenario: Cross-fade
- **WHEN** the Kitchen page is open and the user selects "Living room"
- **THEN** the Kitchen page fades out while the Living room page fades in
- **AND** the sidebar stays still

#### Scenario: Reduced motion
- **WHEN** the browser prefers reduced motion and the user selects "Living room"
- **THEN** the Living room page replaces the Kitchen page without a transition
