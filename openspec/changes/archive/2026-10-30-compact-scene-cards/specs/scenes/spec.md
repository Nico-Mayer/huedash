# Spec Delta

## MODIFIED Requirements

### Requirement: List scenes of a room or zone
The room and zone detail pages SHALL list every scene that belongs to that room or zone, sorted by name. Each scene SHALL show its name and a color strip made from the colors of its light settings. Each scene SHALL show a pointer cursor on hover, so it reads as clickable.

#### Scenario: Kitchen scenes
- **WHEN** the Kitchen has the scenes "Bright", "Relax", and "Tropical"
- **THEN** the Kitchen page lists "Bright", "Relax", "Tropical", each with a color strip

#### Scenario: Scene brightness
- **WHEN** "Relax" sets two lights to 56 %
- **THEN** the "Relax" card shows no brightness

#### Scenario: Scene without brightness
- **WHEN** a scene sets no brightness for any light
- **THEN** its card shows no brightness

#### Scenario: Pointer on hover
- **WHEN** the user moves the mouse over a scene
- **THEN** the cursor is a pointer

#### Scenario: No scenes
- **WHEN** a room has no scenes
- **THEN** the page says there are no scenes yet and that scenes are created in the Hue app

### Requirement: Activate a scene
Selecting a scene SHALL ask the bridge to recall it for its room or zone. A scene with a color palette SHALL start in dynamic mode, so its colors change slowly. A scene without a palette SHALL be recalled the same way the Hue app does.

#### Scenario: Recall Relax
- **WHEN** the user selects "Relax" in the Kitchen
- **AND** "Relax" has no color palette
- **THEN** the bridge receives a recall command for the Relax scene
- **AND** the Kitchen lights change to the Relax settings

#### Scenario: Palette scene starts dynamic
- **WHEN** the user selects "Tropical", which has a color palette
- **THEN** the bridge receives a dynamic recall for the Tropical scene
- **AND** "Tropical" is marked as playing

#### Scenario: Bridge rejects the recall
- **WHEN** the bridge rejects the recall
- **THEN** the page shows an error naming the scene

### Requirement: Limit scene recall rate
The system SHALL send at most one recall per second for the same scene. When the user recalls a scene again within the second, the system SHALL send only the latest recall once the second has passed.

#### Scenario: Recall twice quickly
- **WHEN** the user selects "Tropical" and then switches it to static within one second
- **THEN** the bridge receives the dynamic recall at once and the static recall after the second has passed

## ADDED Requirements

### Requirement: Switch dynamic mode of the active scene
The active scene SHALL show an icon badge next to its name that does not cover the color strip: one icon for dynamic ("Playing") and one for static ("Active"). For a scene with a color palette the badge SHALL switch dynamic mode: "Playing" switches the scene to static, and "Active" switches it to dynamic. The scene stays active. A scene without a palette SHALL show a badge that does not switch.

#### Scenario: Stop playing
- **WHEN** "Tropical" is playing and the user selects its "Playing" badge
- **THEN** the bridge receives a static recall for the Tropical scene
- **AND** "Tropical" is marked as active, not playing

#### Scenario: Start playing again
- **WHEN** "Tropical" is active and static, and the user selects its "Active" badge
- **THEN** the bridge receives a dynamic recall for the Tropical scene
- **AND** "Tropical" is marked as playing

#### Scenario: Scene without a palette
- **WHEN** "Relax" is active and has no color palette
- **THEN** its "Active" badge does not switch anything

#### Scenario: Badge does not cover the strip
- **WHEN** "Tropical" is playing
- **THEN** its badge sits below the color strip, at the end of the name row

#### Scenario: Pointer on the badge
- **WHEN** the user moves the mouse over a badge that switches dynamic mode
- **THEN** the cursor is a pointer

## REMOVED Requirements

### Requirement: Start a dynamic scene
**Reason**: The separate play control is removed. Palette scenes start in dynamic mode by default.
**Migration**: Select the scene to start it dynamically; use the badge of the active scene to switch between dynamic and static.
