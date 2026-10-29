# bridge-config Specification

## Purpose

Defines where huedash reads and stores its bridge configuration, so self-hosters can pair through the UI or configure the container with env vars.

## Requirements

### Requirement: Env vars take precedence
When both `HUE_BRIDGE_IP` and `HUE_APP_KEY` are set, the system SHALL use them as the bridge configuration and SHALL ignore `/data/config.json`. The setup flow SHALL be unavailable in this mode.

#### Scenario: Env vars set
- **WHEN** `HUE_BRIDGE_IP` and `HUE_APP_KEY` are set
- **AND** `/data/config.json` holds a different bridge
- **THEN** the system uses the bridge from the env vars

#### Scenario: Only one env var set
- **WHEN** only one of `HUE_BRIDGE_IP` and `HUE_APP_KEY` is set
- **THEN** the system logs a warning naming the missing variable and falls back to `/data/config.json`

### Requirement: Store pairing in the data directory
After pairing, the system SHALL write the configuration to `config.json` in the data directory (`/data` by default, overridable with `HUE_DATA_DIR`). The file SHALL contain the bridge IP, bridge ID, bridge name, app key, client key, certificate fingerprint, and pairing time, and SHALL be readable only by its owner.

#### Scenario: Pairing saved
- **WHEN** pairing succeeds
- **THEN** `config.json` exists in the data directory with all fields above
- **AND** its file mode allows read and write for the owner only

#### Scenario: Configuration survives restart
- **WHEN** the server restarts after pairing
- **THEN** the same bridge is configured without pairing again

### Requirement: Writes do not corrupt the configuration
The system SHALL replace `config.json` atomically, so an interrupted write leaves either the old or the new configuration.

#### Scenario: Crash during write
- **WHEN** the process stops while saving a new configuration
- **THEN** `config.json` holds either the complete old or the complete new configuration

### Requirement: Report unusable data directory
The system SHALL tell the user when the data directory cannot be written, including the directory path and that it must be writable by the container user.

#### Scenario: Data directory not writable
- **WHEN** pairing succeeds but `config.json` cannot be written
- **THEN** the setup page shows an error naming the data directory and the write permission problem
- **AND** no partial configuration is used

### Requirement: Ignore invalid stored configuration
The system SHALL treat a missing, unreadable, or invalid `config.json` as "no bridge configured" and SHALL log the reason.

#### Scenario: Invalid JSON
- **WHEN** `config.json` contains invalid JSON
- **THEN** the system logs that the configuration is invalid
- **AND** redirects page requests to `/setup`
