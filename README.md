# huedash

Self-hosted web dashboard for Philips Hue.

## Features

- Pair with your Hue bridge from the browser.
- All rooms and zones in a sidebar: switch them on and off and move between them in one click. On phones the sidebar opens from a menu.
- Each room or zone shows its scenes and lights. Set brightness, white color temperature, and color for the whole group, and control single lights.
- Select one or several lights (click, Shift-click, or Select mode on touch screens) and set their brightness, white, and color together. Presets for brightness and white.
- Recall the scenes you made in the Hue app, including dynamic scenes. The active scene shows in the sidebar, and each scene shows its brightness.
- See at a glance how many lights are on, each light's current color, and its product name.
- Live updates: changes from the Hue app, a wall switch, or another huedash tab show up right away.
- Dark mode. Follows your system theme, or pick Light or Dark per device in settings.

## Self-hosting

Run huedash on a machine in the same network as your Hue Bridge.

1. Download [`compose.yaml`](compose.yaml) into an empty folder.
2. Create the data folder and make it writable for the container user (UID 1000):

   ```sh
   mkdir data && sudo chown 1000:1000 data
   ```

3. Start it:

   ```sh
   docker compose up -d
   ```

4. Open `http://<host-ip>:3000` and follow the setup: find your bridge or enter its IP address, then press the link button on the bridge.

The container checks its own health at `/healthz`.

### Bridge settings

After pairing, huedash stores the bridge address, app key, and certificate fingerprint in `/data/config.json`. To pair a different bridge, select **Forget bridge** on the home page. The app key stays on the bridge until you remove it in the Hue app.

You can also configure the bridge with env vars instead. They take precedence over `/data/config.json`, and the setup page is then disabled.

| Variable                 | Meaning                                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `HUE_BRIDGE_IP`          | Bridge address, optionally with `:port`                                                                          |
| `HUE_APP_KEY`            | App key from pairing                                                                                             |
| `HUE_BRIDGE_CERT_SHA256` | Optional. Pins the bridge certificate. Without it, huedash trusts the first certificate and logs its fingerprint |
| `HUE_DATA_DIR`           | Data directory, default `/data`                                                                                  |

### Bridge certificate changed

huedash pins the bridge's TLS certificate when it pairs. If the home page says the certificate changed, the device at that address no longer shows the certificate huedash paired with. This happens when the bridge is replaced or reset, and may happen after a firmware update. If you trust the device, select **Forget bridge** and pair again.

### Behind a reverse proxy

huedash works over plain http on your network. If you put a TLS reverse proxy in front, make sure it sends `X-Forwarded-Proto: https` and does not buffer `/api/events`, which streams live updates.

### Image tags

Images are published to `ghcr.io/nico-mayer/huedash` for `linux/amd64` and `linux/arm64`, one for each release. [CHANGELOG.md](CHANGELOG.md) lists the changes in each release.

| Tag            | Contents           |
| -------------- | ------------------ |
| `latest`       | Latest release     |
| `1.2.3`, `1.2` | A specific release |

## Development

See [AGENTS.md](AGENTS.md) for the workflow and commands.
