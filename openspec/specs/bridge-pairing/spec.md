# bridge-pairing Specification

## Purpose

Lets a user connect huedash to their Philips Hue bridge from the browser: find the bridge, pair with the link button, and remove the pairing again.

## Requirements

### Requirement: Redirect to setup while unconfigured
While no bridge is configured, the system SHALL redirect every page request to `/setup`, except `/setup` itself and `/healthz`.

#### Scenario: Home page without a bridge
- **WHEN** no bridge is configured
- **AND** a user opens `/`
- **THEN** the user is redirected to `/setup`

#### Scenario: Health check without a bridge
- **WHEN** no bridge is configured
- **AND** a client sends `GET /healthz`
- **THEN** the response status is 200 and no redirect happens

#### Scenario: Setup after pairing
- **WHEN** a bridge is configured
- **AND** a user opens `/setup`
- **THEN** the user is redirected to `/`

### Requirement: Find bridges through cloud discovery
The system SHALL offer a "Find bridge" action that asks the Philips Hue discovery service for bridges on the user's network and lists each result with its IP address. The system SHALL only call the discovery service when the user starts this action.

#### Scenario: Bridges found
- **WHEN** the user starts "Find bridge"
- **AND** the discovery service returns one or more bridges
- **THEN** each bridge is listed with its IP address and can be selected

#### Scenario: No bridges found
- **WHEN** the discovery service returns an empty list
- **THEN** the system says no bridge was found and offers manual IP entry

#### Scenario: Discovery service unreachable
- **WHEN** the discovery service does not answer within 10 seconds or returns an error
- **THEN** the system says discovery failed and offers manual IP entry

### Requirement: Enter bridge IP manually
The system SHALL accept a bridge address entered by the user as an IPv4 address or a hostname, optionally followed by `:<port>`, and SHALL reject other input before contacting the network. Without a port, the system SHALL use HTTPS port 443.

#### Scenario: Address with port
- **WHEN** the user enters `192.168.1.20:8443`
- **THEN** the system contacts the bridge at `https://192.168.1.20:8443`

#### Scenario: Invalid address
- **WHEN** the user enters `not an ip!`
- **THEN** the system shows a field error and does not contact any host

### Requirement: Check that the address is a Hue bridge
Before pairing, the system SHALL contact the selected address and confirm that it answers like a Hue bridge, and SHALL show the bridge name and ID.

#### Scenario: Hue bridge found
- **WHEN** the selected address answers with a Hue bridge configuration
- **THEN** the system shows the bridge name and ID and asks the user to press the link button

#### Scenario: Address does not answer
- **WHEN** the selected address does not answer within 5 seconds
- **THEN** the system says it could not reach the bridge and lets the user change the address

#### Scenario: Not a Hue bridge
- **WHEN** the selected address answers but not like a Hue bridge
- **THEN** the system says the device is not a Hue bridge and lets the user change the address

### Requirement: Pair with the link button
After the user is asked to press the link button, the system SHALL request an app key from the bridge repeatedly for up to 60 seconds and SHALL store the configuration as soon as the bridge grants a key.

#### Scenario: Button pressed in time
- **WHEN** the user presses the link button within 60 seconds
- **THEN** the system receives an app key and client key, stores the configuration, and opens `/`

#### Scenario: Button not pressed
- **WHEN** 60 seconds pass without a granted key
- **THEN** the system says pairing timed out and offers to try again

#### Scenario: Waiting is visible
- **WHEN** the system is waiting for the link button
- **THEN** the page shows the remaining time

### Requirement: Show connected bridge
When a bridge is configured, the settings page at `/settings` SHALL show the bridge name and whether the bridge is reachable right now. The home page SHALL link to the settings page.

#### Scenario: Bridge reachable
- **WHEN** a bridge is configured and answers an authenticated request
- **THEN** the settings page shows "Connected to <bridge name>"

#### Scenario: Bridge unreachable
- **WHEN** a bridge is configured but does not answer
- **THEN** the settings page shows the bridge name, says the bridge is not reachable, and offers a retry

### Requirement: Forget bridge
The system SHALL offer a "Forget bridge" action that, after confirmation, deletes the stored configuration and opens `/setup`. The system SHALL tell the user that the app key stays on the bridge until removed in the Hue app.

#### Scenario: Forget confirmed
- **WHEN** the user confirms "Forget bridge"
- **THEN** the stored configuration is deleted
- **AND** the user is redirected to `/setup`

#### Scenario: Forget cancelled
- **WHEN** the user cancels the confirmation
- **THEN** the configuration stays unchanged

#### Scenario: Configuration from env vars
- **WHEN** the bridge is configured through env vars
- **THEN** "Forget bridge" is not available and the page explains that the configuration comes from env vars
