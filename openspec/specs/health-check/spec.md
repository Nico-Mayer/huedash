# health-check Specification

## Purpose

Lets the container runtime and users check that the huedash server is running and able to answer HTTP requests.

## Requirements

### Requirement: Health endpoint reports server is up
The system SHALL answer `GET /healthz` with HTTP 200 and a JSON body `{"status":"ok"}` while the server is running. The endpoint SHALL NOT require authentication and SHALL NOT call the Hue bridge, so it reports the server's state only.

#### Scenario: Server running
- **WHEN** a client sends `GET /healthz`
- **THEN** the response status is 200
- **AND** the body is `{"status":"ok"}` with content type `application/json`

#### Scenario: Bridge unreachable
- **WHEN** the configured Hue bridge does not answer
- **AND** a client sends `GET /healthz`
- **THEN** the response status is still 200

### Requirement: Health endpoint is not cached
The system SHALL send `Cache-Control: no-store` on the `/healthz` response, so proxies and browsers do not serve a stale result.

#### Scenario: Cache header present
- **WHEN** a client sends `GET /healthz`
- **THEN** the response includes the header `Cache-Control: no-store`
