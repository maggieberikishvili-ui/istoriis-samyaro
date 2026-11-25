#!/usr/bin/env python3
"""
სქემატური ისტორიული რუკები გაკვეთილის ბარათებისთვის (SVG → assets/images/map-<id>.svg).

გამოყენება:
    python3 tools/make-map.py            # ყველა რუკა
    python3 tools/make-map.py g9-l5      # მხოლოდ ერთი

რუკა „ქაღალდზე დაბეჭდილი ნივთია“: ფერები ორივე რეჟიმში ერთია (როგორც ურის დაფა),
ამიტომ ისინი აქ, PALETTE-შია და არა variables.css-ში (SVG <img>-ით ჩანს და
გვერდის ცვლადებს ვერ ხედავს). ტონები აღებულია variables.css-ის ღია თემიდან.

გეოგრაფია სქემატურია (გამარტივებული სანაპიროები) — მხოლოდ ორიენტაციისთვის.
ახალი რუკა = ახალი ჩანაწერი MAPS-ში: ჩარჩო (lon/lat), ქალაქები, ისრები, წარწერები.
"""
import json
import math
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets", "images")

PALETTE = {
    "land": "#f3ebdc",        # --parchment
    "sea": "#cfdde3",
    "sea_edge": "#3f6b87",    # --color-slate (ძველი რუკის მელანი)
    "river": "#5f8aa3",
    "mount": "#8c8273",       # --stone-ink
    "ink": "#2b2623",         # --color-text
    "muted": "#6e655b",       # --color-text-muted
    "region": "#8a5a3c",      # --color-brand-tag
    "frame": "#c4b8a4",       # --color-border-strong
    "red": "#a8382f",         # --color-danger
    "green": "#2e6f5e",       # --color-primary
    "terra": "#b85d3b",       # --color-secondary
    "halo": "#f7f3ea",        # --color-bg
    "modern": "#e6ead9",      # თანამედროვე საქართველო — მკრთალი შეფერილობა
    "modern_line": "#a9b39a", # მხარეების საზღვრები
    "modern_text": "#8f9a82", # მხარეების სახელები
}
FONT = "'Noto Sans Georgian', 'BPG Arial', 'Sylfaen', sans-serif"

# ---------- საერთო გეოგრაფია (lat, lon) ----------

CASPIAN = [
    (47.3, 51.6), (46.7, 49.9), (46.1, 49.0), (45.8, 48.4), (45.4, 47.6), (44.8, 47.0),
    (44.2, 47.3), (43.6, 47.5), (43.0, 47.5), (42.5, 47.9), (42.06, 48.35), (41.5, 48.9),
    (41.0, 49.3), (40.55, 49.9), (40.45, 50.35), (40.3, 49.95), (39.9, 49.45), (39.2, 49.3),
    (38.7, 48.9), (37.5, 49.1), (36.9, 50.5), (36.8, 53.9),
    (38.5, 53.9), (39.5, 53.4), (40.5, 52.9), (41.3, 52.6), (42.0, 52.7), (42.8, 52.5),
    (43.6, 51.3), (44.3, 50.3), (44.6, 50.4), (45.0, 51.3), (45.4, 52.8), (46.5, 53.0),
    (47.3, 53.2),
]
BLACK_SEA = [
    (45.6, 35.0), (45.3, 36.6), (44.9, 37.3), (44.7, 37.8), (44.1, 39.07), (43.6, 39.7),
    (43.0, 41.0), (42.6, 41.5), (42.15, 41.67), (41.64, 41.64), (41.3, 41.3), (41.0, 40.5),
    (41.0, 39.7), (40.95, 38.4), (41.2, 36.9), (41.3, 36.3), (41.4, 35.0),
]
RIVERS = {
    "kura": [(41.05, 42.6), (41.4, 43.5), (41.72, 44.79), (41.3, 45.5), (40.7, 46.8),
             (40.0, 47.8), (39.6, 48.6), (39.3, 49.3)],
    "araks": [(39.9, 41.4), (40.1, 43.6), (39.6, 44.9), (38.95, 45.6), (38.9, 46.8),
              (39.6, 47.9), (39.9, 48.5)],
    "terek": [(42.7, 44.6), (43.1, 44.65), (43.7, 45.4), (43.6, 46.6), (43.9, 47.2), (44.1, 47.4)],
    "volga": [(48.6, 45.0), (47.4, 47.0), (46.35, 48.03), (45.85, 48.5)],
    "rioni": [(42.6, 43.5), (42.25, 42.7), (42.15, 41.67)],
}
CAUCASUS = [(44.9, 37.4), (44.2, 39.0), (43.7, 40.6), (43.35, 42.4), (42.9, 43.9),
            (42.65, 44.6), (42.3, 46.0), (41.9, 47.2), (41.3, 48.6)]


# თანამედროვე საქართველოს მხარეები (tools/geo/georgia-adm1.json — geoBoundaries, CC BY 3.0,
# გამარტივებული). რუკაზე ჩნდება, თუ ჩანაწერს აქვს "modern": {...}.
GEO_FILE = os.path.join(ROOT, "tools", "geo", "georgia-adm1.json")


def load_modern():
    with open(GEO_FILE, encoding="utf-8") as f:
        return json.load(f)["regions"]


# ---------- რუკები ----------

MAPS = {
    "g9-l5": {
        "file": "map-g9-l5.svg",
        "title": "პეტრე I-ის ლაშქრობა კასპიისპირეთში და ვახტანგ VI (1722)",
        "frame": {"lon": (39.0, 51.0), "lat": (39.3, 46.6), "width": 560},
        "regions": [
            {"text": "რუსეთის იმპერია", "at": (46.3, 43.0)},
            {"text": "ოსმალეთი", "at": (40.4, 40.6)},
            {"text": "ირანი (სეფიანები)", "at": (39.55, 46.6)},
            {"text": "ქართლი", "at": (41.35, 43.9), "small": True},
            {"text": "კახეთი", "at": (41.85, 45.95), "small": True},
            {"text": "დაღესტანი", "at": (42.95, 46.6), "small": True},
        ],
        "seas": [
            {"text": "შავი ზღვა", "at": (42.55, 40.25)},
            {"text": "კასპიის ზღვა", "at": (42.4, 50.6), "vertical": True},
        ],
        "cities": [
            {"name": "ასტრახანი", "at": (46.35, 48.03), "dx": -9, "dy": 5, "anchor": "end"},
            {"name": "დარუბანდი", "at": (42.06, 48.29), "dx": 9, "dy": 15},
            {"name": "შემახა", "at": (40.63, 48.64), "dx": -8, "dy": 14, "anchor": "end"},
            {"name": "თბილისი", "at": (41.72, 44.79), "capital": True, "dx": -9, "dy": -5, "anchor": "end"},
            {"name": "ცხინვალი", "at": (42.23, 43.97), "dx": -8, "dy": -6, "anchor": "end"},
            {"name": "განჯა", "at": (40.68, 46.36), "dx": 8, "dy": -4},
            {"name": "არზრუმი", "at": (39.9, 41.27), "dx": 8, "dy": -6},
        ],
        "routes": [
            {"color": "red", "points": [(46.3, 48.15), (45.6, 48.7), (44.6, 48.1), (43.4, 48.15), (42.3, 48.45)],
             "label": "პეტრე I, 1722", "label_at": (44.5, 48.4), "anchor": "start"},
            {"color": "red", "dashed": True, "points": [(42.4, 48.0), (43.5, 47.75), (44.6, 47.75)]},
            {"color": "green", "points": [(41.62, 44.95), (41.2, 45.6), (40.6, 46.12)],
             "label": "ვახტანგ VI, 1722", "label_at": (40.95, 45.45), "anchor": "end"},
        ],
        "camps": [{"at": (40.47, 46.38)}],
        "legend": [
            ("red", False, "პეტრე I"),
            ("red", True, "უკან დაბრუნება"),
            ("green", False, "ვახტანგ VI"),
            ("camp", None, "ბანაკი განჯასთან"),
        ],
    },
    "g9-l9": {
        "file": "map-g9-l9.svg",
        "title": "ქართლ-კახეთი და იმერეთი XVIII საუკუნის II ნახევარში",
        "frame": {"lon": (39.9, 47.0), "lat": (40.0, 43.7), "width": 560},
        "modern": {
            # სახელის პოზიცია (lat, lon); None — სახელი არ ეწერება (ადგილი არ ჰყოფნის)
            "labels": {
                "სამეგრელო-ზემო სვანეთი": (42.97, 42.3),
                "რაჭა-ლეჩხუმი და ქვემო სვანეთი": (42.8, 43.75),
                "იმერეთი": (42.42, 43.1),
                "გურია": None,          # ისტორიული „გურია“ იმავე ადგილასაა
                "აჭარა": (41.7, 41.9),
                "სამცხე-ჯავახეთი": (41.3, 43.6),
                "შიდა ქართლი": (42.33, 43.8),
                "მცხეთა-მთიანეთი": (42.45, 44.75),
                "თბილისი": None,        # ქალაქი უკვე აწერია
                "ქვემო ქართლი": (41.5, 44.15),
                "კახეთი": (41.9, 45.95),
            },
        },
        "regions": [
            {"text": "ქართლ-კახეთის სამეფო", "at": (42.22, 45.55)},
            {"text": "იმერეთის სამეფო", "at": (42.62, 43.35)},
            {"text": "ოდიში", "at": (42.62, 41.95), "small": True},
            {"text": "გურია", "at": (42.0, 42.0), "small": True},
            {"text": "ოსმალეთი", "at": (40.75, 42.3)},
            {"text": "ერევნის სახანო", "at": (40.42, 43.75), "small": True},
            {"text": "განჯის სახანო", "at": (40.42, 46.35), "small": True},
        ],
        "seas": [
            {"text": "შავი ზღვა", "at": (41.95, 41.18), "vertical": True},
        ],
        "cities": [
            {"name": "თბილისი", "at": (41.72, 44.79), "capital": True, "dx": 9, "dy": 5},
            {"name": "ქუთაისი", "at": (42.27, 42.70), "capital": True, "dx": -9, "dy": -6, "anchor": "end"},
            {"name": "გორი (1758)", "at": (41.98, 44.11), "dx": 6, "dy": -8},
            {"name": "ხრესილი", "at": (42.12, 43.05), "dx": 11, "dy": 5},
            {"name": "ახალციხე", "at": (41.64, 42.98), "dx": -8, "dy": 15, "anchor": "end"},
            {"name": "ახტალა", "at": (41.15, 44.76), "dx": 8, "dy": 4},
            {"name": "ერევანი", "at": (40.18, 44.51), "dx": 8, "dy": 4},
            {"name": "განჯა", "at": (40.68, 46.36), "dx": 8, "dy": 14},
        ],
        "routes": [
            {"color": "red", "points": [(41.68, 43.0), (41.9, 43.0), (42.06, 43.05)],
             "label": "ოსმალები", "label_at": (41.76, 42.98), "anchor": "end"},
            {"color": "terra", "points": [(40.3, 44.55), (40.85, 44.72), (41.6, 44.8)],
             "label": "ხარკი", "label_at": (40.75, 44.72), "anchor": "start"},
            {"color": "terra", "points": [(40.75, 46.25), (41.2, 45.6), (41.65, 44.95)],
             "label": "ხარკი", "label_at": (41.15, 45.6), "anchor": "start"},
        ],
        "battles": [{"at": (42.12, 43.05)}],
        "legend": [
            ("red", False, "ოსმალები"),
            ("battle", None, "ბრძოლა"),
            ("terra", False, "ხარკი"),
            ("modern", None, "დღევანდელი საქართველო"),
        ],
    },
    "g9-l10": {
        "file": "map-g9-l10.svg",
        "title": "ტოტლებენის ექსპედიცია და ასპინძის ბრძოლა (1769–1770)",
        "frame": {"lon": (41.9, 45.4), "lat": (41.25, 43.0), "width": 560},
        "modern": {
            "labels": {
                "სამეგრელო-ზემო სვანეთი": None,
                "გურია": None,
                "აჭარა": None,
                "აფხაზეთი": None,
                "იმერეთი": (42.42, 42.75),
                "რაჭა-ლეჩხუმი და ქვემო სვანეთი": (42.72, 43.2),
                "სამცხე-ჯავახეთი": (41.38, 43.75),
                "შიდა ქართლი": (42.45, 43.65),
                "მცხეთა-მთიანეთი": (42.6, 45.05),
                "თბილისი": None,
                "ქვემო ქართლი": (41.45, 44.55),
                "კახეთი": (41.95, 45.2),
            },
        },
        "regions": [
            {"text": "ქართლ-კახეთის სამეფო", "at": (42.2, 44.45)},
            {"text": "იმერეთის სამეფო", "at": (42.58, 42.6)},
            {"text": "ახალციხის საფაშო (ოსმალეთი)", "at": (41.32, 42.7), "small": True},
        ],
        "cities": [
            {"name": "თბილისი", "at": (41.72, 44.79), "capital": True, "dx": 9, "dy": 15},
            {"name": "ქუთაისი", "at": (42.27, 42.70), "capital": True, "dx": -9, "dy": -6, "anchor": "end"},
            {"name": "გორი", "at": (41.98, 44.11), "dx": 0, "dy": -10, "anchor": "middle"},
            {"name": "სურამი", "at": (42.02, 43.55), "dx": 0, "dy": -10, "anchor": "middle"},
            {"name": "ასპინძა (1770)", "at": (41.57, 43.25), "dx": 11, "dy": 15},
            {"name": "ახალციხე", "at": (41.64, 42.98), "dx": -8, "dy": 4, "anchor": "end"},
            {"name": "დარიალი", "at": (42.74, 44.62), "dx": -8, "dy": 4, "anchor": "end"},
        ],
        "routes": [
            {"color": "terra", "points": [(43.0, 44.66), (42.74, 44.64), (42.35, 44.72), (41.82, 44.78)],
             "label": "ტოტლებენი, 1769", "label_at": (42.58, 44.66), "anchor": "end"},
            {"color": "green", "points": [(41.75, 44.72), (41.93, 44.15), (41.97, 43.6), (41.78, 43.3), (41.61, 43.25)],
             "label": "ერეკლე II, 1770", "label_at": (41.8, 43.62), "anchor": "start"},
            {"color": "terra", "dashed": True, "points": [(41.8, 43.36), (41.93, 43.48), (41.99, 43.53)]},
            {"color": "red", "points": [(41.64, 43.0), (41.6, 43.2)],
             "label": "ოსმალები და ლეკები", "label_at": (41.52, 43.05), "anchor": "end"},
        ],
        "battles": [{"at": (41.57, 43.25)}],
        "legend": [
            ("terra", False, "ტოტლებენი"),
            ("terra", True, "უკან"),
            ("green", False, "ერეკლე II"),
            ("red", False, "ოსმალები"),
            ("battle", None, "ბრძოლა"),
        ],
    },
    "g9-l11": {
        "file": "map-g9-l11.svg",
        "title": "აღა-მაჰმად-ხანის ლაშქრობა და კრწანისის ბრძოლა (1795)",
        "frame": {"lon": (43.4, 46.9), "lat": (40.55, 42.9), "width": 560},
        "modern": {
            "labels": {
                "სამეგრელო-ზემო სვანეთი": None,
                "გურია": None,
                "აჭარა": None,
                "აფხაზეთი": None,
                "იმერეთი": None,
                "რაჭა-ლეჩხუმი და ქვემო სვანეთი": None,
                "სამცხე-ჯავახეთი": (41.6, 43.8),
                "შიდა ქართლი": (42.3, 43.95),
                "მცხეთა-მთიანეთი": (42.55, 45.15),
                "თბილისი": None,
                "ქვემო ქართლი": (41.2, 44.45),
                "კახეთი": (41.95, 45.75),
            },
        },
        "regions": [
            {"text": "ქართლ-კახეთის სამეფო", "at": (42.08, 44.85)},
        ],
        "cities": [
            {"name": "თბილისი", "at": (41.72, 44.79), "capital": True, "dx": -9, "dy": -4, "anchor": "end"},
            {"name": "კრწანისი (1795)", "at": (41.64, 44.84), "dx": -10, "dy": 15, "anchor": "end"},
            {"name": "განჯა", "at": (40.68, 46.36), "dx": 9, "dy": 4},
            {"name": "დარიალი", "at": (42.74, 44.62), "dx": -8, "dy": 4, "anchor": "end"},
        ],
        "routes": [
            {"color": "red", "points": [(40.72, 46.3), (41.0, 45.7), (41.35, 45.15), (41.6, 44.9)],
             "label": "აღა-მაჰმად-ხანი, 1795", "label_at": (41.0, 45.55), "anchor": "end"},
            {"color": "red", "dashed": True, "points": [(41.68, 44.95), (41.4, 45.35), (41.1, 45.95), (40.8, 46.42)],
             "label": "უკან, ალაფით", "label_at": (41.45, 45.35), "anchor": "start"},
            {"color": "green", "points": [(42.6, 44.64), (42.88, 44.6)],
             "label": "გეორგიევსკისკენ (ტრაქტატი, 1783)", "label_at": (42.8, 44.72), "anchor": "start"},
        ],
        "battles": [{"at": (41.64, 44.84)}],
        "legend": [
            ("red", False, "ირანის ლაშქარი"),
            ("red", True, "უკან"),
            ("green", False, "რუსეთისკენ"),
            ("battle", None, "ბრძოლა"),
        ],
    },
    "g9-l12": {
        "file": "map-g9-l12.svg",
        "title": "დასავლეთ საქართველო და იმერეთის სამეფოს გაუქმება (1804–1810)",
        "frame": {"lon": (40.0, 43.9), "lat": (41.4, 43.5), "width": 560},
        "modern": {
            "labels": {
                "სამეგრელო-ზემო სვანეთი": None,
                "გურია": None,
                "აჭარა": (41.62, 42.15),
                "აფხაზეთი": None,
                "იმერეთი": None,
                "რაჭა-ლეჩხუმი და ქვემო სვანეთი": None,
                "სამცხე-ჯავახეთი": None,
                "შიდა ქართლი": None,
                "მცხეთა-მთიანეთი": None,
                "თბილისი": None,
                "ქვემო ქართლი": None,
                "კახეთი": None,
            },
        },
        "regions": [
            {"text": "იმერეთის სამეფო", "at": (42.5, 43.05)},
            {"text": "სამეგრელოს სამთავრო", "at": (42.62, 41.95), "small": True},
            {"text": "გურიის სამთავრო", "at": (42.0, 42.2), "small": True},
            {"text": "აფხაზეთის სამთავრო", "at": (43.2, 40.75), "small": True},
            {"text": "სვანეთი", "at": (43.05, 42.55), "small": True},
            {"text": "ახალციხის საფაშო (ოსმალეთი)", "at": (41.5, 42.95), "small": True},
        ],
        "cities": [
            {"name": "ქუთაისი", "at": (42.27, 42.70), "capital": True, "dx": -9, "dy": -6, "anchor": "end"},
            {"name": "ვარციხე", "at": (42.15, 42.72), "dx": 11, "dy": 8},
            {"name": "ზუგდიდი", "at": (42.51, 41.87), "dx": -8, "dy": 4, "anchor": "end"},
            {"name": "ოზურგეთი", "at": (41.92, 42.0), "dx": -8, "dy": 4, "anchor": "end"},
            {"name": "ფოთი", "at": (42.15, 41.67), "dx": -8, "dy": 4, "anchor": "end"},
            {"name": "სოხუმი", "at": (43.0, 41.02), "dx": 8, "dy": 12},
            {"name": "ახალციხე", "at": (41.64, 42.98), "dx": 9, "dy": 4},
        ],
        "routes": [
            {"color": "terra", "points": [(42.08, 43.85), (42.12, 43.35), (42.22, 42.95), (42.26, 42.76)],
             "label": "რუსეთის ჯარი, 1804", "label_at": (41.98, 43.85), "anchor": "end"},
            {"color": "terra", "points": [(42.25, 42.66), (42.2, 42.66), (42.16, 42.69)]},
            {"color": "green", "dashed": True, "points": [(42.12, 42.74), (41.95, 42.9), (41.7, 42.97)],
             "label": "სოლომონ II-ის გაქცევა", "label_at": (41.8, 42.88), "anchor": "end"},
        ],
        "battles": [{"at": (42.15, 42.72)}],
        "legend": [
            ("terra", False, "რუსეთის ჯარი"),
            ("green", True, "სოლომონ II"),
            ("battle", None, "ვარციხის აღება"),
        ],
    },
}


# ---------- ხატვა ----------

class Proj:
    def __init__(self, frame):
        self.lon0, self.lon1 = frame["lon"]
        self.lat0, self.lat1 = frame["lat"]
        mid = math.radians((self.lat0 + self.lat1) / 2)
        self.kx = math.cos(mid)
        self.w = frame["width"]
        self.scale = self.w / ((self.lon1 - self.lon0) * self.kx)
        self.h = round((self.lat1 - self.lat0) * self.scale)

    def __call__(self, lat, lon):
        x = (lon - self.lon0) * self.kx * self.scale
        y = (self.lat1 - lat) * self.scale
        return round(x, 1), round(y, 1)


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def path_d(proj, pts, close=False):
    xy = [proj(*p) for p in pts]
    d = "M" + " L".join(f"{x} {y}" for x, y in xy)
    return d + (" Z" if close else "")


def smooth_d(proj, pts):
    """მრუდი წერტილებზე (Catmull-Rom → Bézier) — მდინარეებისა და ისრებისთვის."""
    xy = [proj(*p) for p in pts]
    if len(xy) < 3:
        return "M" + " L".join(f"{x} {y}" for x, y in xy)
    d = f"M{xy[0][0]} {xy[0][1]}"
    for i in range(len(xy) - 1):
        p0 = xy[i - 1] if i else xy[i]
        p1, p2 = xy[i], xy[i + 1]
        p3 = xy[i + 2] if i + 2 < len(xy) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f" C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]} {p2[1]}"
    return d


def text(x, y, s, size, color, weight=400, anchor="start", italic=False, spacing=0, extra=""):
    st = ' font-style="italic"' if italic else ""
    ls = f' letter-spacing="{spacing}"' if spacing else ""
    return (f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{color}" '
            f'text-anchor="{anchor}"{st}{ls} class="t"{extra}>{esc(s)}</text>')


def build(spec):
    P = PALETTE
    proj = Proj(spec["frame"])
    W, H = proj.w, proj.h
    LEG_H = 30
    out = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H + LEG_H}" '
        f'width="{W}" height="{H + LEG_H}" role="img" aria-label="{esc(spec["title"])}">',
        f"<title>{esc(spec['title'])}</title>",
        "<defs>",
        f'<clipPath id="c"><rect width="{W}" height="{H}"/></clipPath>',
        *[
            f'<marker id="a-{k}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" '
            f'orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="{P[k]}"/></marker>'
            for k in ("red", "green", "terra")
        ],
        "</defs>",
        f"<style>.t{{font-family:{FONT};paint-order:stroke;stroke:{P['halo']};stroke-width:3px;"
        f"stroke-linejoin:round}}</style>",
        f'<rect width="{W}" height="{H + LEG_H}" fill="{P["land"]}"/>',
        '<g clip-path="url(#c)">',
        f'<path d="{path_d(proj, BLACK_SEA, True)}" fill="{P["sea"]}" stroke="{P["sea_edge"]}" stroke-width="1"/>',
        f'<path d="{path_d(proj, CASPIAN, True)}" fill="{P["sea"]}" stroke="{P["sea_edge"]}" stroke-width="1"/>',
    ]
    if spec.get("modern"):
        regions = load_modern()
        layer = []
        # 1) სქელი ხაზი ყველა მხარის ირგვლივ → 2) შეფერილობა ზემოდან (შიდა ხაზს ფარავს,
        # გარეთ რჩება ქვეყნის საზღვრის ნახევარი) → 3) მხარეებს შორის წვრილი წყვეტილი ხაზი
        for r in regions:
            for ring in r["rings"]:
                layer.append(f'<path d="{path_d(proj, ring, True)}" fill="none" stroke="{P["modern_line"]}" '
                             f'stroke-width="2.6" stroke-linejoin="round"/>')
        for r in regions:
            for ring in r["rings"]:
                layer.append(f'<path d="{path_d(proj, ring, True)}" fill="{P["modern"]}"/>')
        for r in regions:
            for ring in r["rings"]:
                layer.append(f'<path d="{path_d(proj, ring, True)}" fill="none" stroke="{P["modern_line"]}" '
                             f'stroke-width="0.8" stroke-dasharray="3 2"/>')
        out.extend(layer)

    for pts in RIVERS.values():
        out.append(f'<path d="{smooth_d(proj, pts)}" fill="none" stroke="{P["river"]}" stroke-width="1.3"/>')

    # კავკასიონი — პატარა სამკუთხედები ქედის ხაზზე
    xy = [proj(*p) for p in CAUCASUS]
    marks = []
    for (x1, y1), (x2, y2) in zip(xy, xy[1:]):
        n = max(1, int(math.hypot(x2 - x1, y2 - y1) // 11))
        for i in range(n):
            t = (i + 0.5) / n
            x, y = x1 + (x2 - x1) * t, y1 + (y2 - y1) * t
            marks.append(f"M{x - 4:.1f} {y + 3:.1f} L{x:.1f} {y - 4:.1f} L{x + 4:.1f} {y + 3:.1f}")
    out.append(f'<path d="{" ".join(marks)}" fill="none" stroke="{P["mount"]}" stroke-width="1.2" '
               f'stroke-linejoin="round"/>')

    for s in spec.get("seas", []):
        x, y = proj(*s["at"])
        if s.get("vertical"):
            out.append(f'<g transform="translate({x} {y}) rotate(-90)">'
                       + text(0, 0, s["text"], 13, P["sea_edge"], anchor="middle", italic=True, spacing=1)
                       + "</g>")
        else:
            out.append(text(x, y, s["text"], 13, P["sea_edge"], anchor="middle", italic=True, spacing=1))

    if spec.get("modern"):
        overrides = spec["modern"].get("labels", {})
        for r in load_modern():
            at = overrides.get(r["name"], "auto")
            if at is None:
                continue
            if at == "auto":
                ring = max(r["rings"], key=len)
                at = (sum(p[0] for p in ring) / len(ring), sum(p[1] for p in ring) / len(ring))
            x, y = proj(*at)
            out.append(text(x, y, r["name"], 10, P["modern_text"], anchor="middle", italic=True))

    for r in spec.get("regions", []):
        x, y = proj(*r["at"])
        small = r.get("small")
        out.append(text(x, y, r["text"], 12 if small else 15, P["region"], weight=700,
                        anchor="middle", spacing=0.5 if small else 1.5))

    for rt in spec.get("routes", []):
        dash = ' stroke-dasharray="6 4"' if rt.get("dashed") else ""
        out.append(f'<path d="{smooth_d(proj, rt["points"])}" fill="none" stroke="{P[rt["color"]]}" '
                   f'stroke-width="{2.2 if rt.get("dashed") else 3}" stroke-linecap="round"{dash} '
                   f'marker-end="url(#a-{rt["color"]})"/>')
        if rt.get("label"):
            x, y = proj(*rt["label_at"])
            out.append(text(x + (6 if rt.get("anchor", "start") == "start" else -6), y, rt["label"], 12,
                            P[rt["color"]], weight=700, anchor=rt.get("anchor", "start")))

    for c in spec.get("camps", []):
        x, y = proj(*c["at"])
        out.append(f'<path d="M{x - 7} {y + 5} L{x} {y - 7} L{x + 7} {y + 5} Z" fill="{P["green"]}" '
                   f'stroke="{P["halo"]}" stroke-width="1.2"/>')

    for c in spec.get("battles", []):
        x, y = proj(*c["at"])
        out.append(f'<path d="M{x - 7} {y - 7} L{x + 7} {y + 7} M{x + 7} {y - 7} L{x - 7} {y + 7}" '
                   f'stroke="{P["halo"]}" stroke-width="5" stroke-linecap="round"/>')
        out.append(f'<path d="M{x - 7} {y - 7} L{x + 7} {y + 7} M{x + 7} {y - 7} L{x - 7} {y + 7}" '
                   f'stroke="{P["red"]}" stroke-width="2.6" stroke-linecap="round"/>')

    for c in spec.get("cities", []):
        if any(b["at"] == c["at"] for b in spec.get("battles", [])):
            x, y = proj(*c["at"])
            out.append(text(x + c.get("dx", 7), y + c.get("dy", 4), c["name"], 13, P["ink"], weight=600,
                            anchor=c.get("anchor", "start")))
            continue
        x, y = proj(*c["at"])
        if c.get("capital"):
            out.append(f'<rect x="{x - 4.5}" y="{y - 4.5}" width="9" height="9" fill="{P["ink"]}" '
                       f'stroke="{P["halo"]}" stroke-width="1.5"/>')
        else:
            out.append(f'<circle cx="{x}" cy="{y}" r="3.6" fill="{P["ink"]}" stroke="{P["halo"]}" stroke-width="1.5"/>')
        out.append(text(x + c.get("dx", 7), y + c.get("dy", 4), c["name"], 13, P["ink"], weight=600,
                        anchor=c.get("anchor", "start")))
    out.append("</g>")

    # ჩარჩო და ლეგენდა
    out.append(f'<rect x="0.5" y="0.5" width="{W - 1}" height="{H - 1}" fill="none" stroke="{P["frame"]}"/>')
    lx, ly = 10, H + 19
    for color, dashed, label in spec.get("legend", []):
        if color == "modern":
            out.append(f'<rect x="{lx + 2}" y="{ly - 11}" width="20" height="12" fill="{P["modern"]}" '
                       f'stroke="{P["modern_line"]}" stroke-width="1"/>')
        elif color == "battle":
            out.append(f'<path d="M{lx + 5} {ly - 10} L{lx + 17} {ly + 2} M{lx + 17} {ly - 10} L{lx + 5} {ly + 2}" '
                       f'stroke="{P["red"]}" stroke-width="2.6" stroke-linecap="round"/>')
        elif color == "camp":
            out.append(f'<path d="M{lx + 4} {ly + 1} L{lx + 11} {ly - 11} L{lx + 18} {ly + 1} Z" fill="{P["green"]}"/>')
        else:
            dash = ' stroke-dasharray="6 4"' if dashed else ""
            out.append(f'<path d="M{lx} {ly - 4} H{lx + 22}" stroke="{P[color]}" stroke-width="3"{dash} '
                       f'marker-end="url(#a-{color})"/>')
        out.append(f'<text x="{lx + 30}" y="{ly}" font-size="12" fill="{P["muted"]}" '
                   f'font-family="{FONT}">{esc(label)}</text>')
        lx += 30 + len(label) * 7.6 + 22
    out.append("</svg>")
    return "\n".join(out) + "\n"


def main(ids):
    for mid in ids or MAPS:
        spec = MAPS[mid]
        path = os.path.join(OUT_DIR, spec["file"])
        svg = build(spec)
        with open(path, "w", encoding="utf-8") as f:
            f.write(svg)
        print(f"✓ {os.path.relpath(path, ROOT)} ({len(svg.encode()) // 1024 + 1} KB)")


if __name__ == "__main__":
    main(sys.argv[1:])
