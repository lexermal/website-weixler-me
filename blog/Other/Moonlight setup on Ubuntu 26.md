
# Headless Sunshine + Moonlight on GNOME/Wayland with NVIDIA (no monitor attached)

This is a complete, tested walkthrough for running [Sunshine](https://github.com/LizardByte/Sunshine) as a game-streaming host on a **headless** Ubuntu box — no monitor, no dummy HDMI plug, no VKMS hacks — using stock GNOME 50 on Wayland with an NVIDIA GPU.

## Why this is harder than it looks

If you search for "headless Sunshine GNOME" you'll find advice to use `gnome-shell --headless --virtual-monitor`, or to plug in a VKMS virtual GPU, or to fall back to X11. All three of those are dead ends on a modern (GNOME 50 / Ubuntu 26.04) system, for reasons explained below. The actual fix is to create a **Mutter virtual monitor through the same public API `gnome-remote-desktop` uses internally** — no kernel module, no udev rule, no physical hardware.

### Hardware/software this was built and tested on

- Ubuntu 26.04 ("Resolute"), GNOME 50 / Mutter, GDM3
- Hybrid GPU: AMD Renoir iGPU (`amdgpu`) + NVIDIA RTX 2060 Super (proprietary driver, `nvidia-drm`)
- Self-compiled Sunshine (official Ubuntu 26.04 packages weren't available yet at the time)
- No physical monitor connected to either GPU

Everything here is GPU/driver-agnostic *except* the NVENC driver-version requirement, which is NVIDIA-specific.

---

## Part 1 — Base setup

### 1.1 Install the NVIDIA driver (610+ is required for NVENC)

Sunshine's NVENC backend needs a minimum NVENC API version that ships starting with driver `610.x`:

```
sudo apt update
sudo apt install nvidia-driver-610-open
sudo reboot
```

If you stay on an older driver (e.g. `595.x`), Sunshine will log:

```
Driver does not support the required nvenc API version. Required: 13.1 Found: 13.0
minimum required Nvidia driver for nvenc is 610.00 or newer
```

...and silently fall back to a Vulkan video-encode path, which on a hybrid iGPU/dGPU system produced visibly corrupted video for us (misaligned scanlines) — almost certainly a DMA-BUF/tiling-modifier mismatch importing the AMD-rendered frame into the NVIDIA encoder. **Don't debug that path — just get the driver version right first.**

Verify after reboot:
```
nvidia-smi --query-gpu=driver_version,name --format=csv,noheader
# 610.43.02, NVIDIA GeForce RTX 2060 SUPER
```

### 1.2 Enable GDM autologin

Headless boxes have no one to click through a login prompt, so autologin is required. In `/etc/gdm3/custom.conf`:

```ini
[daemon]
AutomaticLoginEnable=true
AutomaticLogin=<your-username>
WaylandEnable=true
```

Leave `WaylandEnable=true` — see [Part 3](#part-3---two-dead-ends-worth-knowing-about) for why forcing X11 does not work on GNOME 50.

### 1.3 One-time screen-share consent via RDP

GNOME's XDG desktop portal (`ScreenCast`/`RemoteDesktop`) requires an **interactive** consent dialog the first time an app asks to capture the screen or inject input. On a truly headless box there's no way to click "Allow" — so you need a temporary way to see and click that dialog once.

The cleanest way: enable GNOME's built-in RDP server for one session, connect to it, restart Sunshine while connected, click Allow, and GNOME will persist a restore token so you never need to do this again.

```
grdctl rdp enable
grdctl rdp set-credentials <username> <temporary-password>
systemctl --user restart gnome-remote-desktop.service
```

Connect with any RDP client (e.g. Remmina, Windows' own Remote Desktop Connection) to `<host-ip>:3389`, then trigger a Sunshine `/launch` from Moonlight. A GNOME "Allow Remote Desktop / Screen Share" dialog will appear on the RDP session — click **Allow**, and check "Remember This Selection" if offered.

GNOME saves this as a restore token. Sunshine's log will show it being reused on every subsequent launch:

```
Info: [portalgrab] Loaded portal restore token from disk
```

You can leave `gnome-remote-desktop.service` running afterward (handy as a general-purpose remote desktop) or disable it — it's not needed for Sunshine itself once the token exists.

**Keyring gotcha**: if `grdctl rdp set-credentials` fails with `Object does not exist at path .../secrets/collection/login`, it's because a box that's never been through an interactive PAM login has no gnome-keyring "login" collection yet. Create one directly:

```
gdbus call --session \
  --dest org.gnome.keyring \
  --object-path /org/freedesktop/secrets \
  --method org.freedesktop.Secret.Service.OpenSession \
  plain ''
```
(Or use `secret-tool store` once, which triggers the same keyring bootstrap as a side effect.)

### 1.4 Fix a GLib deadlock that hangs real launches (but not the self-test)

Sunshine's bundled Qt system tray calls `new QApplication(...)`, which permanently claims GLib's **default** `GMainContext`. Sunshine's startup self-test runs its portal negotiation on the **main thread** (so it never touches the tray's context and works fine), but a real Moonlight `/launch` request runs `video::probe_encoders()` on a **worker thread**, whose `g_main_loop_run()` call blocks forever waiting for a context Qt already owns.

Symptom: the Sunshine self-test succeeds and the web UI looks healthy, but every real Moonlight connection hangs forever at "Starting desktop" with the log stuck at:
```
Info: [portalgrab] Loaded portal restore token from disk
```
...and nothing after it, no dialog, no error.

**Fix** — disable the tray in `~/.config/sunshine/sunshine.conf`:
```ini
system_tray = disabled
```
This was the single highest-impact fix in this whole project. If your headless Sunshine setup hangs at "Starting desktop" with a clean self-test, try this before anything else below.

---

## Part 2 — The real problem: headless GNOME has no display *and* no input

With the driver, autologin, portal consent, and tray fix in place, video streaming worked. Moonlight showed a real desktop, IDR keyframes, everything. **But mouse and keyboard did nothing.**

### Why input was broken

Sunshine's Linux input backend (`libvirtualhid`, vendored under `third-party/libvirtualhid`) creates two `/dev/uinput`-backed kernel devices — "libvirtualhid Keyboard" and "libvirtualhid Mouse" — and writes raw `input_event` structs to them directly. This is a completely different mechanism from the XDG desktop portal's `RemoteDesktop.NotifyPointerMotion`/`NotifyKeyboardKeycode` virtual-input API; a full grep of the Sunshine source tree turns up zero calls to that API. Everything goes through raw uinput.

That's normally fine — X11 and normal (non-headless) Wayland sessions pick up hotplugged uinput devices automatically via udev + libinput, exactly like a real USB keyboard/mouse. The problem is specific to **headless** Mutter (`--headless --virtual-monitor`, or the automatic headless fallback GDM uses when it detects zero connected monitors): this mode has **no libinput/evdev backend at all**. It's not a permissions bug or a udev tagging issue — it's architectural. Headless Mutter is built to accept input only via the portal's `RemoteDesktop` virtual-input API, which (per above) this Sunshine build simply doesn't use.

You can confirm this yourself: `/proc/<gnome-shell-pid>/fd` for a headless-mode gnome-shell process shows **zero** `/dev/input/*` file descriptors, no matter how correctly your virtual devices are set up at the kernel level. `strace` on Sunshine and raw `xxd` reads on `/dev/input/eventN` will confirm the kernel-level writes succeed perfectly — the break is entirely in Mutter's headless input pipeline, not in Sunshine or in uinput.

## Part 3 — Two dead ends worth knowing about

### 3.1 Switching to X11 does not work on GNOME 50

X11's input model has always supported hotplugged uinput devices natively via libinput/udev, so switching from Wayland to a plain Xorg GNOME session looks like an obvious fix, and it's how a lot of older tutorials solve this exact problem. **On GNOME 50 it is impossible.**

`/usr/lib/systemd/user/org.gnome.Shell@.service` (the systemd unit that starts the shell process itself) ships with:
```ini
AssertEnvironment=XDG_SESSION_TYPE=wayland
```
Xorg itself starts completely fine — NVIDIA driver loads, GLX initializes, everything looks healthy in the Xorg log. But systemd refuses to even launch `gnome-shell` under an X11 session, so `gnome-session` exits cleanly (status 0) within about a second of Xorg coming up, and you're bounced straight back to the GDM login screen. This isn't a config mistake, it's upstream GNOME 50 having fully dropped X11 support in GNOME Shell itself.

If you're on an older GNOME (< 49 or so) this constraint may not apply and switching to X11 might genuinely fix your input problem — but check your `org.gnome.Shell@.service` unit for this assertion before investing time in it.

### 3.2 VKMS is deliberately blocked by Mutter itself

The next obvious idea: load `vkms` (Virtual Kernel Mode Setting), which creates a fake `/dev/dri/cardN` with a connector that reports `connected`, giving Mutter *something* to treat as a real display so it exits headless mode and starts using its normal libinput backend.

This half-works: loading vkms and restarting the session **does** make gnome-shell open real `/dev/input/*` file descriptors for Sunshine's virtual devices, and `libinput debug-events` (from the `libinput-tools` package) will show genuine `POINTER_MOTION`/`POINTER_BUTTON`/`KEYBOARD_KEY` events decoded correctly in real time as you interact via Moonlight. **Input, at the libinput level, is completely fixed by this.**

But the screen stays black. `/usr/lib/udev/rules.d/61-mutter.rules` — shipped by upstream Mutter, not a distro patch — contains:
```
ENV{DEVPATH}=="/devices/faux/vkms/drm/card[0-9]*", TAG+="mutter-device-ignore"
```
Mutter's own journal confirms it: `Ignoring DRM device '/dev/dri/card0'`. This is deliberate — VKMS is meant only for GNOME's own automated test harness, and Mutter refuses to ever paint anything to it in a real session. Worse, if Sunshine's capture backend is left on its default (`capture` unset, auto-detecting KMS), it will happily pick the vkms card as its capture source once it exists (`Screencasting with KMS`, `Found monitor for DRM screencasting`) — meaning you get a perfectly working input pipeline streaming an eternally-black framebuffer.

You *can* override the `mutter-device-ignore` tag with a custom udev rule (recent systemd/udev supports `TAG-=`), but that runs Mutter in a configuration its own developers explicitly excluded from production use — a real risk if this box needs to run anything else that depends on a stable, fully-supported GPU-accelerated desktop (e.g. DaVinci Resolve). **We do not recommend this path**; Part 4 gets you a fully-supported alternative that needs neither VKMS nor a physical dummy plug.

---

## Part 4 — The real fix: a Mutter virtual monitor via the RemoteDesktop/ScreenCast API

### The insight

`gnome-remote-desktop` (GNOME's own RDP server) already solves exactly this problem — headless RDP sessions show real desktop content and accept real input with zero physical monitor and zero VKMS. `strings` on its binary reveals the mechanism:

```
grd_session_record_virtual / handle-record-virtual / RecordVirtual
org.gnome.Mutter.ScreenCast.Session
org.gnome.Mutter.RemoteDesktop.Session
NotifyPointerMotionAbsolute / NotifyPointerButton / NotifyKeyboardKeycode ...
[RDP] Remote Desktop session will use virtual monitors
```

The flow is: `RemoteDesktop.CreateSession` → `ScreenCast.CreateSession(remote-desktop-session-id=...)` → `Session.RecordVirtual({is-platform: true})`. This creates a Mutter **`MetaVirtualMonitor`** — a monitor with **no backing DRM device at all**. It doesn't touch `/dev/dri`, udev, or vkms in any way, so the `mutter-device-ignore` tag is completely irrelevant to it — this is a first-class, fully-supported Mutter feature, just normally only exposed through `gnome-remote-desktop`'s internals.

One implementation detail: Mutter only actually instantiates the virtual monitor once a **PipeWire consumer** negotiates a concrete, fixed resolution on the stream it hands back. No consumer → no monitor ever gets created. A consumer that doesn't pin width/height gets a monitor sized at the negotiation's minimum (effectively 1×1, which will not appear as a usable resolution). A consumer that also pins a *fixed framerate* will fail negotiation entirely — Mutter advertises a variable framerate (`0/1`) on this node, and any hard framerate constraint in your caps makes GStreamer report `no more input formats`. Pin width/height only; leave framerate alone.

### 4.1 The virtual-monitor holder script

Save this as `~/vmon/virtual-monitor.py`:

```python
#!/usr/bin/env python3
"""Create a persistent Mutter virtual monitor with NO DRM device at all.

This is the exact mechanism gnome-remote-desktop uses for its headless RDP
sessions (verified by `strings /usr/libexec/gnome-remote-desktop-daemon`):

  org.gnome.Mutter.RemoteDesktop.CreateSession
  org.gnome.Mutter.ScreenCast.CreateSession(remote-desktop-session-id=...)
  ScreenCast.Session.RecordVirtual({is-platform: true})  -> PipeWire node

Mutter instantiates the MetaVirtualMonitor when a PipeWire consumer negotiates
a concrete resolution on that node, so we attach a throwaway GStreamer consumer
with pinned caps to force the size.  No VKMS, no dummy HDMI plug, no udev rules.

Usage: virtual-monitor.py [WIDTHxHEIGHT] [REFRESH]
"""
import sys, os, signal, json
import gi
gi.require_version("Gst", "1.0")
from gi.repository import Gio, GLib, Gst

geom = sys.argv[1] if len(sys.argv) > 1 else "1920x1080"
rate = sys.argv[2] if len(sys.argv) > 2 else "60"
W, H = (int(x) for x in geom.split("x"))

Gst.init(None)
bus = Gio.bus_get_sync(Gio.BusType.SESSION, None)


def call(dest, path, iface, method, params=None, rt=None):
    return bus.call_sync(dest, path, iface, method, params,
                         GLib.VariantType(rt) if rt else None,
                         Gio.DBusCallFlags.NONE, -1, None)


RD = "org.gnome.Mutter.RemoteDesktop"
SC = "org.gnome.Mutter.ScreenCast"

# Wait for gnome-shell to own the Mutter private bus names (we may be started
# before/at the same time as the shell). Exit non-zero so systemd retries.
import time
for _ in range(60):
    try:
        call("org.freedesktop.DBus", "/org/freedesktop/DBus", "org.freedesktop.DBus",
             "GetNameOwner", GLib.Variant("(s)", (SC,)), "(s)")
        break
    except GLib.GError:
        time.sleep(1)
else:
    raise SystemExit("org.gnome.Mutter.ScreenCast never appeared")

rd = call(RD, "/org/gnome/Mutter/RemoteDesktop", RD, "CreateSession", None, "(o)").unpack()[0]
sid = call(RD, rd, "org.freedesktop.DBus.Properties", "Get",
           GLib.Variant("(ss)", (RD + ".Session", "SessionId")), "(v)").unpack()[0]
sc = call(SC, "/org/gnome/Mutter/ScreenCast", SC, "CreateSession",
          GLib.Variant("(a{sv})", ({"remote-desktop-session-id": GLib.Variant("s", sid)},)),
          "(o)").unpack()[0]
stream = call(SC, sc, SC + ".Session", "RecordVirtual",
              GLib.Variant("(a{sv})", ({"cursor-mode": GLib.Variant("u", 1),
                                        "is-platform": GLib.Variant("b", True)},)),
              "(o)").unpack()[0]

pipeline = None
node_id = None


def start_consumer():
    global pipeline
    # NOTE: do NOT pin framerate - mutter advertises framerate 0/1 (variable)
    # and any fixed framerate in the caps filter makes negotiation fail with
    # "no more input formats". Only width/height must be pinned; without them
    # the consumer picks the range minimum (1x1) and you get a 1x1 monitor.
    desc = (f"pipewiresrc path={node_id} ! "
            f"video/x-raw,width={W},height={H} ! "
            f"fakesink sync=false")
    pipeline = Gst.parse_launch(desc)
    gbus = pipeline.get_bus()
    gbus.add_signal_watch()

    def on_msg(_b, msg):
        t = msg.type
        if t == Gst.MessageType.ERROR:
            err, dbg = msg.parse_error()
            print("GST ERROR:", err, dbg, flush=True)
        elif t == Gst.MessageType.STATE_CHANGED and msg.src == pipeline:
            o, n, p = msg.parse_state_changed()
            print(f"GST pipeline state {o.value_nick} -> {n.value_nick}", flush=True)
    gbus.connect("message", on_msg)
    pipeline.set_state(Gst.State.PLAYING)
    print(f"consumer attaching to pipewire node {node_id} @ {W}x{H} :: {desc}", flush=True)
    return False


def on_sig(conn, sender, path, iface, signame, params):
    global node_id
    if signame == "PipeWireStreamAdded" and path == stream:
        node_id = params.unpack()[0]
        GLib.idle_add(start_consumer)


bus.signal_subscribe(None, SC + ".Stream", "PipeWireStreamAdded", stream, None,
                     Gio.DBusSignalFlags.NONE, on_sig)


def on_closed(*_a):
    # Mutter tore the session down (e.g. shell restart, screen lock inhibit).
    # Exit non-zero so systemd restarts us and a fresh monitor is created.
    print("session closed by mutter - exiting for restart", flush=True)
    raise SystemExit(1)


bus.signal_subscribe(None, RD + ".Session", "Closed", rd, None,
                     Gio.DBusSignalFlags.NONE, on_closed)
bus.signal_subscribe(None, SC + ".Session", "Closed", sc, None,
                     Gio.DBusSignalFlags.NONE, on_closed)

call(RD, rd, RD + ".Session", "Start")

info = dict(remote_desktop_session=rd, screencast_session=sc, stream=stream,
            session_id=sid, pid=os.getpid(), size=[W, H])
os.makedirs(os.path.expanduser("~/vmon"), exist_ok=True)
with open(os.path.expanduser("~/vmon/session.json"), "w") as f:
    json.dump(info, f, indent=2)
print(json.dumps(info), flush=True)

loop = GLib.MainLoop()


def quit_(*a):
    if pipeline:
        pipeline.set_state(Gst.State.NULL)
    try:
        call(RD, rd, RD + ".Session", "Stop")
    except Exception:
        pass
    loop.quit()


signal.signal(signal.SIGTERM, quit_)
signal.signal(signal.SIGINT, quit_)
loop.run()
```

Dependencies (Ubuntu):
```
sudo apt install python3-gi gir1.2-gstreamer-1.0 gstreamer1.0-pipewire
```

### 4.2 systemd user service to keep it running

Save as `~/.config/systemd/user/gnome-virtual-monitor.service`:

```ini
[Unit]
Description=Headless virtual monitor for the GNOME session (Mutter MetaVirtualMonitor)
Documentation=man:mutter(1)
After=gnome-session.target graphical-session.target
PartOf=graphical-session.target
# Sunshine must not start capturing before a monitor exists
Before=app-dev.lizardbyte.app.Sunshine.service

[Service]
Type=simple
ExecStart=/usr/bin/python3 %h/vmon/virtual-monitor.py 1920x1080
Restart=always
RestartSec=3

[Install]
WantedBy=gnome-session.target
```

> Replace `app-dev.lizardbyte.app.Sunshine.service` with whatever your own Sunshine systemd unit is actually called (`systemctl --user list-unit-files | grep -i sunshine`) — this ordering dependency is what guarantees the monitor exists before Sunshine starts probing for one.

```
systemctl --user daemon-reload
systemctl --user enable --now gnome-virtual-monitor.service
```

Verify it created a real monitor:
```
systemctl --user status gnome-virtual-monitor.service
```
You should see log lines like:
```
{"remote_desktop_session": "...", "screencast_session": "...", "stream": "...", "size": [1920, 1080]}
consumer attaching to pipewire node NN @ 1920x1080 :: pipewiresrc path=NN ! video/x-raw,width=1920,height=1080 ! fakesink sync=false
```

You can independently confirm Mutter now reports a real monitor via `org.gnome.Mutter.DisplayConfig.GetCurrentState` — it will list something like `"Meta-0" "MetaVendor" "Virtual remote monitor" "1920x1080@60.000"` where it previously reported zero monitors.

### 4.3 Point Sunshine at the portal capture backend explicitly

In `~/.config/sunshine/sunshine.conf`:
```ini
capture = portal
```

This matters even after you get a working virtual monitor: if you ever load VKMS for any reason, or if some other decoy DRM device shows up, Sunshine's auto-detection prefers KMS capture over the portal whenever *any* DRM card reports a connected connector — including a card Mutter is silently ignoring. Pinning `capture = portal` makes Sunshine always use the same PipeWire/portal path that the virtual monitor is designed for, regardless of what shows up in `/dev/dri`.

### 4.4 Restart and verify

```
systemctl --user restart <your-sunshine-service>
journalctl --user -u <your-sunshine-service> -n 30 --no-pager
```

Look for:
```
Found output: 'Meta-0' 1920x1080
Found H.264 encoder: h264_nvenc
Found HEVC encoder: hevc_nvenc
```

Connect with Moonlight — you should now get real video *and* working mouse input.

One harmless, self-healing warning you may see on the first connection each session:
```
[portalgrab] Negotiation failed, will retry without maxFramerate
```
Sunshine requests a `maxFramerate` range Mutter doesn't support on this stream type; it detects the failure and retries without it automatically. It only happens once per process.

**Caveat**: every time the virtual monitor service (re)creates a session, Mutter assigns it a new serial number, which invalidates Sunshine's saved portal restore token — so the "Allow screen share" dialog can reappear. In normal steady-state operation the service creates exactly one monitor per boot and keeps it alive (`Restart=always` just keeps the *process* alive, it doesn't recreate the monitor unless Mutter itself tears the session down), so this is rare. If it does reappear, it now renders on a real, visible monitor, so you can click it directly from within your Moonlight session.

---

## Part 5 — The keyboard-specific bug (mouse works, keyboard doesn't)

After Part 4, video and mouse both worked perfectly. **Keyboard input still did nothing.**

### Root cause

`/usr/bin/sunshine` (as built) carries a file capability:
```
$ getcap /usr/bin/sunshine
/usr/bin/sunshine cap_sys_admin=p
```
This is there to support Sunshine's `kmsgrab` capture backend (which needs `CAP_SYS_ADMIN` for direct DRM access) — but we're not using that backend, we've pinned `capture = portal`.

Having `cap_sys_admin=p` makes the process `AT_SECURE` at exec time, which routes it down a different, more privileged startup path. The practical, observable effect on this system: by the time `libvirtualhid` opens `/dev/uinput` to create its virtual devices, **file descriptor 0 is free**. The *first* uinput device created — the keyboard — lands on fd 0:

```
/proc/<sunshine-pid>/fd/0  -> /dev/uinput      (the keyboard)
/proc/<sunshine-pid>/fd/9  -> /dev/uinput      (the mouse)
```

Shortly after, the first `pipe()` or `socket()` call anywhere in the process takes the lowest free descriptor — which is now 0, since it's a plain open file descriptor from the process's point of view — silently closing the keyboard's *last reference* to its own uinput device. The kernel destroys the device (it disappears from `/proc/bus/input/devices`), and every subsequent keystroke fails with:
```
Warning: submit libvirtualhid keyboard input: failed to write uinput event: Bad file descriptor
```
The mouse is created after the keyboard and lands on a higher, unaffected descriptor, so it keeps working — which is exactly the symptom: **mouse works, keyboard does not, with no keyboard-specific code involved at all.**

Verified by direct comparison — identical binary, only the capability differs:

| binary | capability | fd 0 after start | keyboard fd |
|---|---|---|---|
| packaged `/usr/bin/sunshine` | `cap_sys_admin=p` | `/dev/uinput` (reproduced 3/3 restarts) | 0 — destroyed |
| capability-stripped copy | none | `/dev/null` (2/2 restarts) | 9 — stable |

### Fix

```
sudo setcap -r /usr/bin/sunshine
systemctl --user daemon-reload
systemctl --user restart <your-sunshine-service>
```

Verify:
```
getcap /usr/bin/sunshine
# (should print nothing / no capabilities)

ls -l /proc/$(systemctl --user show <your-sunshine-service> -p MainPID --value)/fd/0
# should NOT point at /dev/uinput

grep 'libvirtualhid Keyboard' /proc/bus/input/devices
# should be present
```

This is safe specifically *because* this setup pins `capture = portal` — if you ever need `kmsgrab` (e.g. no portal/PipeWire available), you'll need the capability back and will need a different fix (an `LD_PRELOAD` shim that relocates the uinput descriptors above fd 2 before `libvirtualhid` opens them is one option, but wasn't needed here).

If a future Sunshine package upgrade re-adds the capability (common — packaging scripts often reapply `setcap` on install/upgrade), just rerun the same command.

---

## Part 6 — Optional cleanup

If you experimented with VKMS while chasing this (as we did — see Part 3.2), it's worth removing once the virtual-monitor fix is in place, since a `connected` decoy DRM card can still make Sunshine's *auto-detected* capture backend pick the wrong (black) source if you ever unset `capture = portal`:

```
sudo tee /etc/modprobe.d/blacklist-vkms.conf <<'EOF'
blacklist vkms
install vkms /bin/false
EOF
sudo update-initramfs -u
sudo modprobe -r vkms   # or just reboot
```

If you also tried the X11 detour from Part 3.1, you can remove the leftover files it creates without any effect on the now-working Wayland setup:
- `/usr/share/xsessions/ubuntu.desktop` (if you created one manually — it's never chosen due to the `AssertEnvironment=XDG_SESSION_TYPE=wayland` block)
- `/etc/X11/xorg.conf` (only relevant if something explicitly starts Xorg, which nothing does in this setup)

---

## Summary checklist

- [ ] NVIDIA driver ≥ 610.x installed (`nvidia-smi` confirms), for NVENC
- [ ] GDM `AutomaticLoginEnable=true` + `WaylandEnable=true`
- [ ] One-time portal consent granted via a temporary RDP session; restore token persisted
- [ ] `system_tray = disabled` in `sunshine.conf` (fixes the GMainContext hang on real launches)
- [ ] `gnome-virtual-monitor.service` installed, enabled, and confirmed creating a real Mutter monitor (`DisplayConfig.GetCurrentState` shows ≥1 monitor)
- [ ] `capture = portal` in `sunshine.conf`
- [ ] `sudo setcap -r /usr/bin/sunshine` (fixes keyboard-specific fd-0 bug)
- [ ] Moonlight shows real video, mouse works, keyboard works
- [ ] (Optional) VKMS blacklisted if you'd experimented with it
