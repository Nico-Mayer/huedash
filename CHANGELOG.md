# Changelog

## 0.1.0 - 2026-10-30

### Features

- Scaffold SvelteKit project
- Add shadcn-svelte with placeholder page
- Add /healthz endpoint
- Parse bridge addresses with optional port
- Pin bridge TLS certificate by fingerprint
- Add Hue client for config, pairing and status
- Store bridge config atomically in data dir
- Resolve bridge config from env or data dir
- Redirect to setup until a bridge is paired
- Find bridges with cloud discovery
- Add setup actions to pair with a bridge
- Add bridge setup page
- Load bridge status and forget the bridge
- Show connected bridge on the home page
- Load rooms, zones and lights from the bridge
- Convert colors to Hue xy and mirek
- Throttle bridge commands per group
- Add group and light command endpoints
- Add room and light controls
- Move bridge status to a settings page
- List rooms and zones on the home page
- Add room and zone detail pages
- Map bridge events to live updates
- Share one bridge event stream per bridge
- Stream live updates to the browser
- Keep live bridge state in the browser
- Apply live updates on open pages
- Derive scene colors from their actions
- Load scenes into the home model
- Add scene recall endpoint
- Send scene status as live updates
- Track scene status in the browser
- List and recall scenes on room pages
- Follow the system color theme
- Pick the theme in settings
- Share group state between views
- Navigate rooms and zones from a sidebar
- Open the first room from the home page
- Apply group and light changes in every view
- Lay out room pages with an inspector
- Report the current white or color of each light
- Accept white and color for single lights
- Send light white and color as live updates
- Track selected lights
- Select lights by clicking their cards
- Control a group or selected lights through one target
- Add brightness and white presets
- Control selected lights in a bottom sheet on narrow screens
- Report light swatches and product names
- Report scene brightness
- Send light swatches as live updates
- Summarize lights that are on in the home
- Show light color and product on light cards
- Show the home summary and light colors in the sidebar
- Show scene brightness
- Follow live values with a tween
- Add a level slider with a value label
- Use the level slider for inspector brightness
- Use the level slider on light cards
- Use the level slider for white
- Move hue and saturation smoothly
- Add the room header
- Control rooms and lights in a dialog
- Add white gradient stops to the home model
- Add vertical, light-colored level sliders
- Color card and header sliders like the light
- Add a hue and saturation color pad
- Pick colors with the color pad
- **Breaking:** Show one control at a time in the dialog
- Cross-fade pages when switching rooms
- Let the throttle merge waiting values
- Check bridge resources with zod schemas
- Keep the home in a server-side store
- api: Accept static scene recalls
- Make scene cards compact
- Add release task
- Use package version as app version

### Bug fixes

- Accept form posts over plain http on the LAN
- Let API requests answer for themselves without a bridge
- Separate the unreachable count in the room header
- Draw one selection ring on light cards
- Keep light cards on narrow screens and icons readable
- Remount the inspector for another group

### Performance

- Switch rooms without a bridge request

### Refactoring

- Move app pages into an (app) route group
- Load the home once in the app layout
- Give setup and app pages their own layouts
- Build the inspector from a control target
- **Breaking:** Remove presets and the old white control
- Name the color pad marker radius
