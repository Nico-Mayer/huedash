# bridge-connection Specification

## Purpose

Defines how huedash connects to the Hue bridge over HTTPS, so the connection is trusted without a public CA and impostor devices on the LAN are rejected.

## Requirements

### Requirement: Bridge calls happen on the server
The system SHALL send all requests to the Hue bridge from the huedash server. The browser SHALL NOT receive the app key or contact the bridge directly.

#### Scenario: Page data
- **WHEN** a configured home page loads in the browser
- **THEN** no response sent to the browser contains the app key or client key

### Requirement: Pin the bridge certificate on first contact
On the first HTTPS contact with a bridge during setup, the system SHALL accept the bridge's certificate and record its SHA-256 fingerprint. All later requests to that bridge SHALL be rejected unless the presented certificate has the recorded fingerprint.

#### Scenario: Same certificate
- **WHEN** a configured bridge presents the certificate recorded during pairing
- **THEN** the request proceeds

#### Scenario: Different certificate
- **WHEN** a device at the configured address presents a different certificate
- **THEN** the request is rejected before any app key is sent
- **AND** the home page says the bridge certificate changed and offers to forget the bridge and pair again

### Requirement: Pinning with env var configuration
When the bridge is configured through env vars, the system SHALL use `HUE_BRIDGE_CERT_SHA256` as the pinned fingerprint if set. If it is not set, the system SHALL pin the certificate seen on the first connection for the lifetime of the process and log its fingerprint.

#### Scenario: Fingerprint given
- **WHEN** `HUE_BRIDGE_CERT_SHA256` is set and the bridge presents a different certificate
- **THEN** the request is rejected

#### Scenario: Fingerprint not given
- **WHEN** `HUE_BRIDGE_CERT_SHA256` is not set
- **THEN** the first connection succeeds and the log shows the certificate fingerprint to set

### Requirement: Bound request time
The system SHALL abort a bridge request that takes longer than 5 seconds and report the bridge as unreachable.

#### Scenario: Bridge hangs
- **WHEN** the bridge accepts a connection but does not answer within 5 seconds
- **THEN** the request is aborted and the bridge is reported unreachable
