# UI copy

Rules for all text in the huedash interface. Based on the `ux-writing` skill.

## Voice

huedash is calm, direct, and practical. It speaks like a helpful housemate, not a manual.

- Plain words, short sentences (8-14 words).
- Talk to the user as "you". Avoid "we" unless the app did something.
- Sentence case everywhere: titles, buttons, labels, menus.
- No jokes in errors or warnings.

| Do | Don't |
|---|---|
| Your lights are ready to use. | Your Hue ecosystem has been successfully initialized! |
| Couldn't reach your bridge. | Oopsie! The bridge is playing hide and seek. |

## Tone

Voice stays the same. Tone follows the situation.

| Situation | Tone | Example |
|---|---|---|
| Routine control (toggle, dim) | Silent or one word | No toast. The light state is the feedback. |
| First setup | Patient, step by step | Press the button on your bridge. We'll wait 30 seconds. |
| Error | Calm, solution first | Couldn't reach your bridge. Check that it's on and try again. |
| Destructive action | Serious, clear consequence | Delete scene "Evening"? This can't be undone. |

| Do | Don't |
|---|---|
| Light turned on with no toast. | "Success! Kitchen light is now on." toast on every toggle. |

## Hue terms

Use the same terms as the Hue app. Use one term per concept, everywhere.

| Term | Meaning | Don't use |
|---|---|---|
| Bridge | The Hue Bridge device on the network | Hub, gateway, controller |
| Light | One bulb, strip, or lamp | Bulb, device, lamp (as a generic term) |
| Room | A group of lights in one physical room | Group, area |
| Zone | A custom group of lights, can span rooms | Group, custom room |
| Scene | Saved light settings for a room or zone | Preset, mood, profile |
| Brightness | How bright a light is, in percent | Intensity, level, dim value |
| Color temperature | White light from warm to cool | CT, mirek, kelvin (in UI) |
| Pair | Connect huedash to a bridge | Register, link, authenticate |

Never show raw API terms (`grouped_light`, `mirek`, `rid`, `app key`) in the UI. Put them in logs only.

| Do | Don't |
|---|---|
| Kitchen is on. 3 of 4 lights on. | grouped_light 7f2c... on=true |

## Buttons and labels

- Buttons: `[Verb] [object]`, 2-4 words. Say what happens.
- Labels: noun phrases. Put helper text below the field, not in the placeholder.
- Icon-only buttons need an `aria-label` with the same verb + object.
- Toggles describe the thing, not the action: label "Kitchen", not "Turn on kitchen".

| Do | Don't |
|---|---|
| Pair bridge | Submit |
| Activate scene | OK |
| Bridge IP address (helper: "Find it in your router or the Hue app.") | Placeholder "Enter IP here" with no label |
| `aria-label="Turn off all lights"` on a power icon | Icon button with no label |

## Error states

Pattern: `[What failed]. [Likely cause, if known]. [What to do].` 12-18 words.

- Never blame the user. Never show a raw error code alone.
- Always offer a next step: a retry button, a link to settings, or a clear instruction.
- Inline field errors state the requirement: "IP address must look like 192.168.1.20".

| Situation | Do | Don't |
|---|---|---|
| Bridge offline | Couldn't reach your bridge. Check that it's on and connected, then try again. | Error: ECONNREFUSED |
| Pairing timeout | Pairing timed out. Press the bridge button, then select Try again within 30 seconds. | Invalid request. |
| Command failed | Couldn't change Kitchen. Try again. | Something went wrong. |

## Empty states

Pattern: explain why it's empty + one action. Use the shadcn-svelte `Empty` component.

| Situation | Do | Don't |
|---|---|---|
| No bridge paired | No bridge connected yet. Pair your bridge to control your lights. [Pair bridge] | Nothing here. |
| No scenes in room | No scenes for Kitchen yet. Create them in the Hue app. | 0 scenes |
| No zones | You don't have any zones. Zones group lights across rooms. | Empty list with no text |

## Loading states

- Under 1 second: show nothing.
- Lists and cards: use `Skeleton` in the layout of the content. No spinner text.
- Actions: `Spinner` inside the button, button disabled, label stays the same.
- Long waits (pairing, discovery): say what is happening and how long it takes.

| Do | Don't |
|---|---|
| Room cards as skeletons while loading. | "Loading..." text in the middle of the page. |
| Waiting for bridge button... 24 s left | Please wait. |
