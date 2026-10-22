"""Build the portfolio site's media + data from the approved showcase videos.

Usage:
  python3 build.py            # production: full videos open on YouTube (ids in YOUTUBE below)
  python3 build.py --preview  # local preview: full videos play from ~/Desktop/Portfolio_Videos

Reads each video spec in ~/Desktop/Portfolio_Videos/_Tools/*.json, copies the silent loop and a
web-sized poster into site/assets/work/<slug>/, and writes site/projects.js.
"""
import json, glob, os, shutil, sys
from PIL import Image

HOME = os.path.expanduser("~")
VIDEOS = f"{HOME}/Desktop/Portfolio_Videos"
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "docs")
PREVIEW = "--preview" in sys.argv

# Curated details per project (spec "name" -> details). Projects not listed here are not published.
PROJECTS = {
    "Aviation_Maintenance_Sim": dict(cat="xr", company="Ediiie", year="2023–24", featured=1,
        summary="VR maintenance training for an EASA-certified aviation training centre — 150+ mechanical modules such as the jet engine, each with Learn and Practice modes and a proficiency score."),
    "Jet_Engine_VR": dict(cat="xr", company="Ediiie", year="2023–24",
        summary="VR jet-engine training with a virtual instructor and an AI tutor that answers trainees' questions in text and voice."),
    "HP_Server_VR": dict(cat="xr", company="Ediiie", year="2023–24",
        summary="VR server-hardware training on a holographic stage, with exploded views, spec callouts and an X-ray mode."),
    "Server_Hardware_VR": dict(cat="xr", company="Ediiie", year="2023–24",
        summary="VR server-hardware training on a holographic stage, with exploded views, spec callouts and an X-ray mode."),
    "NIA_Human_Anatomy": dict(cat="xr", company="Ediiie", year="2023–24", featured=3,
        summary="3D/VR anatomy education for a Rajasthan Government project, covering all 11 human body systems with labelled models and guided topics."),
    "AirportVerse": dict(cat="xr", company="Ediiie", year="2023–24",
        summary="A VR airport journey: check-in, baggage X-ray, security and body scan, through to the departure gate."),
    "VR_Wellbeing": dict(cat="xr", company="", year="",
        summary="VR health and wellbeing programme with a doctor avatar, treatment education, guided meditation and smoking-cessation exercises."),
    "Tartarus_VR": dict(cat="xr", company="Ediiie", year="2023–24", link=("Meta Quest store", "https://www.meta.com/experiences/6620771114718251/"),
        summary="Published VR action game on the Meta Quest store: melee combat against towering demons, God Powers and portals."),
    "AR_Car_Controller": dict(cat="xr", company="Ediiie", year="2023–24",
        summary="iOS AR driving: LiDAR scans the room into a live mesh and a virtual car drives and collides with real furniture."),
    "AR_Furniture": dict(cat="xr", company="Ediiie", year="2023–24",
        summary="Browser-based WebAR (8th Wall) that lets shoppers place products on their own walls before buying."),
    "CC_Bio": dict(cat="xr", company="", year="",
        summary="Interactive 3D equipment configurator: orbit, explode and label a full industrial system, then request specs through a built-in form with an admin export."),
    "Sinverse": dict(cat="multi", company="Ediiie", year="2023–24", link=("sinverse.com", "https://sinverse.com/"),
        summary="Multiplayer open-world metaverse with team battles, third-person gunplay and timed matches."),
    "Celebrity_Golf": dict(cat="multi", company="Igniva Solutions", year="2016–18",
        summary="Real-time 1 vs 1 mobile golf with tours, entry fees, rewards and physics-driven ball flight."),
    "Poker": dict(cat="multi", company="Techmoweb", year="2018–19",
        summary="Multiplayer Texas Hold'em from a large card-game product with several games on one shared platform."),
    "Cash_Cow": dict(cat="multi", company="Fierce Guppy Game Labs", year="2025",
        summary="Competitive 2D platformer with rooms, entry fees, friends, challenges and leaderboards."),
    "Number_Rangers": dict(cat="multi", company="Fierce Guppy Game Labs", year="2025",
        summary="Mobile math game with online PvP, ELO ratings, player vs AI and timed rounds."),
    "Prize_Match": dict(cat="booth", company="Fierce Guppy Game Labs", year="2025",
        summary="Memory-match booth game on the FG Booth Control platform: attract screen, timed rounds, combo scoring, leaderboard and lead capture."),
    "Ice_Hockey": dict(cat="booth", company="Fierce Guppy Game Labs", year="2025",
        summary="Booth hockey shoot-out with a separate kiosk for player sign-in, timed rounds and a branded score card."),
    "Soccer_Splatter": dict(cat="booth", company="Fierce Guppy Game Labs", year="2025",
        summary="Booth soccer game where every hit splatters paint across the goal, with a timed round and a mascot finale."),
    "Paint_Splat": dict(cat="booth", company="Fierce Guppy Game Labs", year="2025",
        summary="Booth soccer game where every hit splatters paint across the goal, with a timed round and a mascot finale."),
    "Rollercoaster": dict(cat="games", company="Fierce Guppy Game Labs", year="2025",
        summary="Amusement-park management game: run rides, keep them clean, collect earnings and unlock boosts, with a Christmas edition."),
    "Vulcan_Tower_Defense": dict(cat="games", company="Ediiie", year="2023–24", featured=2,
        link=("App Store", "https://apps.apple.com/in/app/vulcans-tower-defense/id1658249651"),
        summary="Real-time tower defense in a Greek-Roman myth world — 12 levels, 14 towers and endless waves. Reached 50,000+ downloads within 2 months."),
    "Vulcan_Runner": dict(cat="games", company="Ediiie", year="2023–24",
        link=("Google Play", "https://play.google.com/store/apps/details?id=com.vulcan.runner"),
        summary="Endless runner through lava dungeons and ancient ruins, with shields, poison mode and mobile touch controls."),
    "Chuck_The_Sallar": dict(cat="games", company="Igniva Solutions", year="2016–18",
        summary="Endless runner: outrun the Fat Lazy Cop through the city, dodge traffic and clear level targets."),
    "Horror_Survivor": dict(cat="games", company="Ediiie", year="2023–24",
        summary="First-person survival horror with flashlight exploration, zombie hordes and an AI fox companion."),
    "Stellar_Void": dict(cat="games", company="", year="",
        summary="Mobile space shooter with ship customisation, cockpit flight through asteroid fields and dogfights."),
    "Pixel_Game": dict(cat="games", company="", year="",
        summary="Handheld-style pixel-art arcade game with themed levels: snowboarding, underwater and an ice-cavern yeti finale."),
}

PROJECTS.update({
    "Perfect_Hit": dict(cat="booth", company="Fierce Guppy Game Labs", year="2025",
        summary="Booth game on the FG Booth Control platform with timed rounds, lead capture form and a live leaderboard."),
    "Flap_Word": dict(cat="booth", company="Fierce Guppy Game Labs", year="2025",
        summary="Tap-to-flap word game for trade-show booths: collect the right letters, complete words for bonuses, beat the timer."),
    "Prize_Drop": dict(cat="booth", company="Fierce Guppy Game Labs", year="2025",
        summary="Digital Plinko for trade-show booths: tap to drop the puck and win prizes, with an operator panel to set prize odds and stock."),
    "Target_Strike": dict(cat="booth", company="Fierce Guppy Game Labs", year="2025",
        summary="Fast reaction booth game: hit targets before they expire, chain combos as difficulty ramps up, with operator-selectable themes."),
    "Word_Trail": dict(cat="booth", company="Fierce Guppy Game Labs", year="2025",
        summary="Word-trail booth game with themed worlds, built on the FG Booth Control platform."),
})

# Display order: newest and most polished first. Projects not listed go to the end.
ORDER = ["Perfect_Hit", "Flap_Word", "Aviation_Maintenance_Sim", "Target_Strike", "Prize_Drop", "Word_Trail", "Prize_Match", "Soccer_Splatter", "Paint_Splat",
         "Ice_Hockey", "Rollercoaster", "Cash_Cow", "Number_Rangers", "Jet_Engine_VR", "NIA_Human_Anatomy",
         "Vulcan_Tower_Defense", "Tartarus_VR", "Sinverse", "Vulcan_Runner", "AR_Car_Controller", "Server_Hardware_VR",
         "HP_Server_VR", "AirportVerse", "VR_Wellbeing", "CC_Bio", "Celebrity_Golf", "Chuck_The_Sallar", "Horror_Survivor",
         "Stellar_Void", "Pixel_Game", "AR_Furniture", "Poker"]
BIG = {"Perfect_Hit", "Aviation_Maintenance_Sim", "Vulcan_Tower_Defense"}

CATEGORIES = [("all", "All work"), ("xr", "XR & Simulation"), ("multi", "Multiplayer"), ("booth", "Booth & Events"), ("games", "Mobile & PC Games")]

# Fill in after uploading to YouTube: spec name -> video id (the part after watch?v=)
YOUTUBE = {}


def main():
    out = []
    link = os.path.join(SITE, "full")  # preview only: lets the local server play the full showcase videos
    if PREVIEW and not os.path.islink(link):
        os.symlink(VIDEOS, link)
    if not PREVIEW and os.path.islink(link):
        os.remove(link)
    dst_root = os.path.join(SITE, "assets", "work")
    os.makedirs(dst_root, exist_ok=True)
    for spec_path in sorted(glob.glob(f"{VIDEOS}/_Tools/*.json")):
        s = json.load(open(spec_path))
        meta = PROJECTS.get(s["name"])
        if not meta:
            continue
        folder = os.path.expanduser(s["out_dir"])
        loop, poster, show = (os.path.join(folder, f"{s['name']}_{k}") for k in ("Loop.mp4", "Poster.jpg", "Showcase.mp4"))
        if not (os.path.exists(loop) and os.path.exists(poster)):
            print("skip (missing files):", s["name"])
            continue
        slug = s["name"].lower()
        d = os.path.join(dst_root, slug)
        os.makedirs(d, exist_ok=True)
        shutil.copy2(loop, os.path.join(d, "loop.mp4"))
        img = Image.open(poster).convert("RGB")
        img.thumbnail((1280, 1280))
        img.save(os.path.join(d, "poster.jpg"), quality=82, optimize=True, progressive=True)
        vertical = s.get("orientation") == "vertical"
        full = None
        if s["name"] in YOUTUBE:
            full = {"type": "youtube", "id": YOUTUBE[s["name"]]}
        elif PREVIEW and os.path.exists(show):
            full = {"type": "file", "src": "full/" + os.path.relpath(show, VIDEOS)}
        out.append({
            "slug": slug, "title": s["title"], "kicker": " · ".join(p.strip() for p in s["kicker"].split("·")),
            "cat": meta["cat"], "company": meta.get("company", ""), "year": meta.get("year", ""),
            "summary": meta["summary"], "features": [c["caption"] for c in s["clips"] if c.get("caption")],
            "vertical": vertical, "big": s["name"] in BIG, "featured": s["name"] in BIG, "link": meta.get("link"),
            "_order": ORDER.index(s["name"]) if s["name"] in ORDER else 999,
            "loop": f"assets/work/{slug}/loop.mp4", "poster": f"assets/work/{slug}/poster.jpg", "full": full,
        })
    out.sort(key=lambda p: (p.pop("_order"), p["title"]))
    with open(os.path.join(SITE, "projects.js"), "w") as f:
        f.write("window.PROJECTS = " + json.dumps(out, ensure_ascii=False, indent=1) + ";\n")
        f.write("window.CATEGORIES = " + json.dumps(CATEGORIES) + ";\n")
    cv = f"{HOME}/Desktop/CV_Final/Ankush_Arora_CV_2026.pdf"
    if os.path.exists(cv):
        shutil.copy2(cv, os.path.join(SITE, "assets", "Ankush_Arora_CV.pdf"))
    print(f"{len(out)} projects -> {SITE}")


if __name__ == "__main__":
    main()
