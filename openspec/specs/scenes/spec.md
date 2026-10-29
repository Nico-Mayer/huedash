# scenes Specification

## Purpose

Lets the user recall the scenes they created in the Hue app for a room or zone, including dynamic scenes, and see which scene is active.

## Requirements

### Requirement: List scenes of a room or zone
The room and zone detail pages SHALL list every scene that belongs to that room or zone, sorted by name. Each scene SHALL show its name and a color strip made from the colors of its light settings.

#### Scenario: Kitchen scenes
- **WHEN** the Kitchen has the scenes "Bright", "Relax", and "Tropical"
- **THEN** the Kitchen page lists "Bright", "Relax", "Tropical", each with a color strip

#### Scenario: No scenes
- **WHEN** a room has no scenes
- **THEN** the page says there are no scenes yet and that scenes are created in the Hue app

### Requirement: Activate a scene
Selecting a scene SHALL ask the bridge to recall it for its room or zone, the same way the Hue app does.

#### Scenario: Recall Relax
- **WHEN** the user selects "Relax" in the Kitchen
- **THEN** the bridge receives a recall command for the Relax scene
- **AND** the Kitchen lights change to the Relax settings

#### Scenario: Bridge rejects the recall
- **WHEN** the bridge rejects the recall
- **THEN** the page shows an error naming the scene

### Requirement: Start a dynamic scene
For scenes with a color palette, the system SHALL offer a play control that recalls the scene in dynamic mode, so its colors change slowly.

#### Scenario: Play Tropical
- **WHEN** the user selects play on "Tropical"
- **THEN** the bridge receives a dynamic recall for the Tropical scene

#### Scenario: Scene without a palette
- **WHEN** a scene has no color palette
- **THEN** it has no play control

### Requirement: Show the active scene
The room or zone page SHALL mark the active scene and whether it plays dynamically. The home page card of the room or zone SHALL show the active scene's name.

#### Scenario: Relax active
- **WHEN** the bridge reports "Relax" as active in the Kitchen
- **THEN** the Kitchen page marks "Relax" as active
- **AND** the Kitchen card on the home page shows "Relax"

#### Scenario: No active scene
- **WHEN** no scene of a room is active, for example after the user changes a light
- **THEN** no scene is marked and the card shows only on/off and brightness
