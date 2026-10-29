# Spec Delta

## MODIFIED Requirements

### Requirement: List scenes of a room or zone
The room and zone detail pages SHALL list every scene that belongs to that room or zone, sorted by name. Each scene SHALL show its name, a color strip made from the colors of its light settings, and its brightness: the average brightness of its light settings that set one, in percent.

#### Scenario: Kitchen scenes
- **WHEN** the Kitchen has the scenes "Bright", "Relax", and "Tropical"
- **THEN** the Kitchen page lists "Bright", "Relax", "Tropical", each with a color strip

#### Scenario: Scene brightness
- **WHEN** "Relax" sets two lights to 56 %
- **THEN** the "Relax" card shows "56 %"

#### Scenario: Scene without brightness
- **WHEN** a scene sets no brightness for any light
- **THEN** its card shows no brightness

#### Scenario: No scenes
- **WHEN** a room has no scenes
- **THEN** the page says there are no scenes yet and that scenes are created in the Hue app
