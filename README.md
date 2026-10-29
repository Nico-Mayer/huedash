# huedash

Self-hosted web dashboard for Philips Hue.

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

4. Open `http://<host-ip>:3000`.

The container checks its own health at `/healthz`.

### Image tags

Images are published to `ghcr.io/nico-mayer/huedash` for `linux/amd64` and `linux/arm64`.

| Tag            | Contents                    |
| -------------- | --------------------------- |
| `latest`       | Latest release              |
| `1.2.3`, `1.2` | A specific release          |
| `edge`         | Latest commit on `main`     |
| `sha-<commit>` | A specific commit on `main` |

## Development

See [AGENTS.md](AGENTS.md) for the workflow and commands.
