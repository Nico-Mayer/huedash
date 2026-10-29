# Spec Delta

## MODIFIED Requirements

### Requirement: Show the active scene
The room or zone page SHALL mark the active scene and whether it plays dynamically. The sidebar entry of the room or zone SHALL show the active scene's name.

#### Scenario: Relax active
- **WHEN** the bridge reports "Relax" as active in the Kitchen
- **THEN** the Kitchen page marks "Relax" as active
- **AND** the Kitchen entry in the sidebar shows "Relax"

#### Scenario: No active scene
- **WHEN** no scene of a room is active, for example after the user changes a light
- **THEN** no scene is marked and the sidebar entry shows how many lights are on
