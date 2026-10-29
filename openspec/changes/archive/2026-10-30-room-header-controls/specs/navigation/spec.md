# Spec Delta

## ADDED Requirements

### Requirement: Room page layout
Room and zone pages SHALL show the room header at the top, then the scenes and the lights at the full width of the page column. On screens 768 px and wider the header SHALL stay at the top of the page column while the page scrolls. On narrower screens it SHALL scroll with the page.

#### Scenario: Wide screen
- **WHEN** the Kitchen page is open on a screen 1440 px wide
- **THEN** the sidebar is on the left, and the header, scenes, and lights are in one column next to it

#### Scenario: Sticky header
- **WHEN** the Kitchen page is open on a screen 1024 px wide and the user scrolls down to the lights
- **THEN** the header with the switch and brightness slider stays visible at the top

#### Scenario: Phone
- **WHEN** the Kitchen page is open on a screen 390 px wide and the user scrolls down
- **THEN** the header scrolls out of view

### Requirement: Control dialog
The control dialog for a room, zone, or light SHALL open centered over the page on screens 768 px and wider, and as a bottom sheet on narrower screens. White and color SHALL be two tabs when both are available. Closing the dialog SHALL keep the page's scroll position.

#### Scenario: Wide screen
- **WHEN** the user opens the "Ceiling" dialog on a screen 1440 px wide
- **THEN** the dialog shows centered over the page

#### Scenario: Phone
- **WHEN** the user taps the "Ceiling" card on a screen 390 px wide, scrolled to the lights
- **THEN** a bottom sheet opens with the controls for "Ceiling"
- **AND** after closing it, the page keeps its scroll position

#### Scenario: White and color
- **WHEN** the Kitchen supports color temperature and color and the user opens its dialog
- **THEN** the dialog shows a White tab and a Color tab

## REMOVED Requirements

### Requirement: Inspector for the open group
**Reason**: The inspector is replaced by the room header and the control dialog.
**Migration**: Control the group from the header and its "Color and white" dialog, and a light from its card's dialog.
