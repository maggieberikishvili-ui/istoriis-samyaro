# -*- coding: utf-8 -*-
"""
ისტორიის სამყარო — თეორიული ბარათების აუდიო (Azure, ქართული ხელოვნური ხმა)
---------------------------------------------------------------------------
გაკვეთილის თეორიულ ბარათებს ხმად აქცევს და ინახავს:
  assets/audio/<გაკვეთილი>/<ნაბიჯი>-<ჰეში>.mp3
და ანახლებს js/audio-manifest.js-ს (lesson.js მისით აჩენს 🔊 ღილაკს).

გამოყენება (პროექტის საქაღალდიდან):
  python3 tools/make-audio.py grade-8 g8-l37            — აუდიოს დამზადება
  python3 tools/make-audio.py grade-8 g8-l37 --print    — მხოლოდ ტექსტის ნახვა (Azure-ის გარეშე)

გასაღები: ~/.config/istoriis-samyaro/azure-speech.env (პროექტის გარეთ — არასოდეს git-ში!)
  AZURE_SPEECH_KEY=…
  AZURE_SPEECH_REGION=swedencentral

უკვე დამზადებული ფაილი თავიდან არ მზადდება (ჰეში ტექსტზეა დამოკიდებული):
ბარათის ტექსტი თუ შეიცვალა, ახალი ფაილი მზადდება, ძველი იშლება.
"""
import hashlib
import http.client
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from xml.sax.saxutils import escape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSC = "/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc"
KEY_FILE = os.path.expanduser("~/.config/istoriis-samyaro/azure-speech.env")
MANIFEST = os.path.join(ROOT, "js", "audio-manifest.js")

VOICE = "ka-GE-EkaNeural"   # ქალის ხმა
RATE = "-5%"                # ოდნავ ნელა — მოსწავლისთვის
PITCH = "-5%"               # ოდნავ დაბალი ტონი (ავტორმა აირჩია 3 ვარიანტიდან)
STYLE = ""                  # Azure-ის სტილი (მაგ. „friendly“) — ქართულ ხმას შეიძლება არ ჰქონდეს

# პაუზები (მილიწამი)
PAUSE_TITLE = 700           # სათაურის შემდეგ
PAUSE_ITEM = 500            # სიის პუნქტებს შორის
PAUSE_FACT = 600            # „საინტერესო ფაქტის“ წინ
PAUSE_ASIDE = 200           # ფრჩხილების გარშემო

# ---------- ტექსტის მომზადება ხმისთვის ----------

ORDINALS = [None, "პირველი", "მეორე", "მესამე", "მეოთხე", "მეხუთე", "მეექვსე", "მეშვიდე", "მერვე",
            "მეცხრე", "მეათე", "მეთერთმეტე", "მეთორმეტე", "მეცამეტე", "მეთოთხმეტე", "მეთხუთმეტე",
            "მეთექვსმეტე", "მეჩვიდმეტე", "მეთვრამეტე", "მეცხრამეტე", "მეოცე", "ოცდამეერთე",
            "ოცდამეორე", "ოცდამესამე", "ოცდამეოთხე", "ოცდამეხუთე"]
ROMAN = {"I": 1, "V": 5, "X": 10}


def roman_to_int(s):
    total = 0
    for i, ch in enumerate(s):
        v = ROMAN[ch]
        total += -v if i + 1 < len(s) and ROMAN[s[i + 1]] > v else v
    return total


def ordinal(n, suffix=""):
    word = ORDINALS[n] if 0 < n < len(ORDINALS) else str(n)
    if not suffix:
        return word
    # „II-ის“ → „მეორის“, „III-მ“ → „მესამემ“, „IV-ს“ → „მეოთხეს“
    if suffix[0] in "აეიოუ" and word.endswith("ე"):
        word = word[:-1]
    if suffix[0] in "აეიოუ" and word.endswith("ი"):
        word = word[:-1]
    # მოთხრობითი: „ბაიაზიდ I-მა“ → „პირველმა“, „II-მა“ → „მეორემ“
    if suffix == "მა":
        if word.endswith("ი"):
            word = word[:-1]
        else:
            suffix = "მ"
    return word + suffix


# ---------- რიცხვები სიტყვებით (Azure „1204 წელს“-ს „ათას ორას ოთხი წელს“-ად კითხულობს) ----------

UNITS = ["", "ერთი", "ორი", "სამი", "ოთხი", "ხუთი", "ექვსი", "შვიდი", "რვა", "ცხრა", "ათი",
         "თერთმეტი", "თორმეტი", "ცამეტი", "თოთხმეტი", "თხუთმეტი", "თექვსმეტი", "ჩვიდმეტი",
         "თვრამეტი", "ცხრამეტი"]
TWENTIES = {1: "ოც", 2: "ორმოც", 3: "სამოც", 4: "ოთხმოც"}
HUNDREDS = ["", "ას", "ორას", "სამას", "ოთხას", "ხუთას", "ექვსას", "შვიდას", "რვაას", "ცხრაას"]

# სიტყვები, რომელთა წინ რიცხვი ბოლო „ი“-ს კარგავს: „ოთხ წელს“, „ოცდაშვიდ ნოემბერს“
SHORT_BEFORE = ("წელს", "წლამდე", "იანვარს", "თებერვალს", "მარტს", "აპრილს", "მაისს", "ივნისს",
                "ივლისს", "აგვისტოს", "სექტემბერს", "ოქტომბერს", "ნოემბერს", "დეკემბერს")


def below_100(n):
    if n < 20:
        return UNITS[n]
    tens, rest = divmod(n, 20)
    return TWENTIES[tens] + ("ი" if rest == 0 else "და" + UNITS[rest])


def number_words(n):
    """1204 → „ათას ორას ოთხი“ (სრული ფორმა)."""
    if n == 0:
        return "ნული"
    parts = []
    thousands, n = divmod(n, 1000)
    if thousands:
        parts.append(("" if thousands == 1 else number_words(thousands) + " ") + "ათას")
    hundreds, n = divmod(n, 100)
    if hundreds:
        parts.append(HUNDREDS[hundreds])
    if n:
        parts.append(below_100(n))
    else:
        parts[-1] += "ი"  # „ათასი“, „ორასი“
    return " ".join(parts)


def short_form(words):
    """„ოთხი“ → „ოთხ“ (არსებითის წინ: „ოთხ წელს“); „რვა“, „ცხრა“ არ იცვლება."""
    return words[:-1] if words.endswith("ი") else words


def ablative(words):
    """„ორი“ → „ორიდან“, „რვა“ → „რვიდან“."""
    return words + "დან" if words.endswith("ი") else words[:-1] + "იდან"


def terminative(words):
    """„ოთხი“ → „ოთხამდე“, „რვა“ → „რვამდე“."""
    return (words[:-1] if words.endswith("ი") else words) + ("ამდე" if words.endswith("ი") else "მდე")


def say_numbers(t):
    # დიაპაზონი „1202–1204“ → „ათას ორას ორიდან ათას ორას ოთხამდე“
    t = re.sub(r"\b(\d{1,4})\s*[–-]\s*(\d{1,4})\b(?!-)",
               lambda m: ablative(number_words(int(m.group(1)))) + " " + terminative(number_words(int(m.group(2)))), t)

    def one(m):
        words = number_words(int(m.group(1)))
        nxt = m.group(2)
        # მიცემითი („125 ვაჭარს“) → მოკლე ფორმა; ნათესაობითი („1330 წლის“) — სრული
        dative = nxt.endswith("ს") and not nxt.endswith("ის")
        return (short_form(words) if nxt.startswith(SHORT_BEFORE) or dative else words) + " " + nxt

    # რიცხვი + შემდეგი სიტყვა; „1204-ში“-ის მსგავს ფორმებს Azure-ს ვუტოვებთ
    t = re.sub(r"\b(\d{1,4}) ([ა-ჰ]+)", one, t)
    t = re.sub(r"\b(\d{1,4})\b(?!-)", lambda m: number_words(int(m.group(1))), t)
    return t


# შემოკლებები და უცხო სიტყვები (ახალი ცუდად წაკითხული სიტყვა → აქ დაამატე)
REPLACE = [
    (r"\b46-ე\b", "ორმოცდამეექვსე"),                 # „46-ე მერიდიანი“
    (r"\b46°-სა", "ორმოცდაექვს გრადუსსა"),            # 1529 წლის ხელშეკრულება
    (r"\b142°-ს", "ას ორმოცდაორ გრადუსს"),
    (r"(?<![A-Za-z])C ვიტამინ", "ცე ვიტამინ"),
    (r"(?<![ა-ჰ])პორტ\.", "პორტუგალიურად"),
    (r"(?<![ა-ჰ])ესპ\.", "ესპანურად"),
    (r"(?<![ა-ჰ])ე\. ?წ\.", "ეგრეთ წოდებული"),
    (r"(?<![ა-ჰ])მაგ\.", "მაგალითად"),
    (r"(?<![ა-ჰ])სხვ\.", "სხვა"),
    (r"(?<![ა-ჰ])წმ\.", "წმინდა"),
    (r"(?<![ა-ჰ])ბერძნ\.", "ბერძნულად"),
    (r"(?<![ა-ჰ])ლათ\.", "ლათინურად"),
    (r"(?<![ა-ჰ])გერმ\.", "გერმანულად"),
    (r"(?<![ა-ჰ])არაბ\.", "არაბულად"),
    (r"(?<![ა-ჰ])სპარს\.", "სპარსულად"),
    (r"(?<![ა-ჰ])თურქ\.", "თურქულად"),
    (r"\bUNESCO-?", "იუნესკო"),
    (r"\bDictatus Papae\b", "დიქტატუს პაპე"),
    (r"\bland\b", "ლანდ"),
    (r"\btag\b", "ტაგ"),
    (r"(?<![ა-ჰ])ინგლ\.", "ინგლისურად"),
    (r"(?<![ა-ჰ])კმ-(?=[ა-ჰ])", "კილომეტრ"),
    (r"(?<![ა-ჰ])კგ-(?=[ა-ჰ])", "კილოგრამ"),
    (r"(?<![ა-ჰ])კგ(?![ა-ჰ])", "კილოგრამი"),
    (r"(?<![ა-ჰ])კმ(?![ა-ჰ])", "კილომეტრი"),
    # ლათინური/ბერძნული სიტყვები (მე-7 კლასი) — ქართული ასოებით, რომ ქართულმა ხმამ წაიკითხოს
    (r"\bchronos\b", "ქრონოს"), (r"\blogos\b", "ლოგოს"), (r"\bethnos\b", "ეთნოს"),
    (r"\bgrapho\b", "გრაფო"), (r"\bmageia\b", "მაგეია"), (r"\banima\b", "ანიმა"),
    (r"\bglobe\b", "გლოუბ"), (r"\bres publica\b", "რეს პუბლიკა"), (r"\bveto\b", "ვეტო"),
    (r"\bpublicum\b", "პუბლიკუმ"), (r"\bprivatum\b", "პრივატუმ"), (r"\bcivile\b", "ცივილე"),
    (r"\bius\b", "იუს"), (r"\bgladius\b", "გლადიუს"), (r"\bimperator\b", "იმპერატორ"),
    (r"\bMare Nostrum\b", "მარე ნოსტრუმ"), (r"\bPax Romana\b", "პაქს რომანა"),
    (r"\s*/\s*", " ან "),
    (r"\s*\+\s*", " და "),
]


def stem(words):
    """ბოლო „ი“-ს მოშორება: „სამოცი“ → „სამოც“ (სუფიქსის წინ)."""
    return words[:-1] if words.endswith("ი") else words


def number_forms(t):
    """რიცხვი სუფიქსით/შემოკლებით — say_numbers-მდე."""
    # „527–565 წწ.“ → „ხუთას ოცდაშვიდიდან ხუთას სამოცდახუთ წლამდე“
    t = re.sub(r"(\d{1,4})\s*[–-]\s*(\d{1,4}) წწ\.",
               lambda m: ablative(number_words(int(m.group(1)))) + " " + short_form(number_words(int(m.group(2)))) + " წლამდე", t)
    # „800 წ.“ → „რვაასი წელი“
    t = re.sub(r"(\d{1,4}) წ\.", lambda m: number_words(int(m.group(1))) + " წელი", t)
    # „60-იანი წლები“ → „სამოციანი“, „1170-იან“ → „ათას ას სამოცდაათიან“
    t = re.sub(r"(\d{1,4})-(იან[ა-ჰ]*)", lambda m: stem(number_words(int(m.group(1)))) + m.group(2), t)
    # „30-წლიანი“ → „ოცდაათწლიანი“
    t = re.sub(r"(\d{1,4})-(წლიან[ა-ჰ]*)", lambda m: short_form(number_words(int(m.group(1)))) + m.group(2), t)
    # „1104-ით“ → „ათას ას ოთხით“
    t = re.sub(r"(\d{1,4})-ით\b", lambda m: stem(number_words(int(m.group(1)))) + "ით", t)
    # „1100–1200°C-მდე“ → „ათას ასიდან ათას ორას გრადუსამდე“; „1085°C“ → „… გრადუსი“
    t = re.sub(r"(\d{1,4})\s*[–-]\s*(\d{1,4})\s*°C-მდე",
               lambda m: ablative(number_words(int(m.group(1)))) + " " + short_form(number_words(int(m.group(2)))) + " გრადუსამდე", t)
    t = re.sub(r"(\d{1,4})\s*°C-მდე", lambda m: short_form(number_words(int(m.group(1)))) + " გრადუსამდე", t)
    t = re.sub(r"(\d{1,4})\s*°C", lambda m: number_words(int(m.group(1))) + " გრადუსი", t)
    # „53 000 ჰექტარს“ → „ორმოცდაცამეტი ათას ჰექტარს“ (ათასეულები ჰარით; ბრუნვაში — მოკლე ფორმა)
    def thousands(m):
        words = number_words(int(m.group(1) + m.group(2)))
        nxt = m.group(3)
        return (short_form(words) if nxt.endswith("ს") and not nxt.endswith("ის") else words) + " " + nxt  # მიცემითი: „ჰექტარს“; ნათესაობითი „წლის“ — სრული
    t = re.sub(r"\b(\d{1,3})[  ](\d{3}) ([ა-ჰ]+)", thousands, t)
    # „400-მდე“ → „ოთხასამდე“, „3-დან“ → „სამიდან“, „700-ზე“ → „შვიდასზე“
    # „100 000-მდე“ — ათასეულები ჰარით
    N = r"(\d{1,3}[ \u00a0]\d{3}|\d{1,4})"
    num = lambda m: number_words(int(re.sub(r"\D", "", m.group(1))))
    t = re.sub(N + r"-მდე\b", lambda m: terminative(num(m)), t)
    t = re.sub(N + r"-დან\b", lambda m: ablative(num(m)), t)
    t = re.sub(N + r"-ზე\b", lambda m: stem(num(m)) + "ზე", t)
    # „2 000-ს“ → „ორი ათასს“, „300-ს“ → „სამასს“
    t = re.sub(N + r"-ს(?![ა-ჰ])", lambda m: short_form(num(m)) + "ს", t)
    # „18-მეტრიანი“ → „თვრამეტმეტრიანი“, „8000-წლოვანი“, „365-დღიანი“, „12-მაგ“
    t = re.sub(r"(\d{1,4})-((?:[ა-ჰ]+(?:იან|ოვან)|მაგ)[ა-ჰ]*)",
               lambda m: short_form(number_words(int(m.group(1)))) + m.group(2), t)
    return t


def speakable(text):
    t = text.replace("•", " ").replace("\n", " ")
    for pattern, repl in REPLACE:
        t = re.sub(pattern, repl, t)
    # „XIII–XIV სს.“ → „მეცამეტე–მეთოთხმეტე საუკუნეები“
    t = re.sub(r"\b([IVX]+)\s*[–-]\s*([IVX]+) სს\.",
               lambda m: ordinal(roman_to_int(m.group(1))) + "–" + ordinal(roman_to_int(m.group(2))) + " საუკუნეები", t)
    t = number_forms(t)
    t = say_numbers(t)
    # „XIII ს.“ → „მეცამეტე საუკუნე“
    t = re.sub(r"\b([IVX]+) ს\.", lambda m: ordinal(roman_to_int(m.group(1))) + " საუკუნე", t)
    # „ისააკ II-ის“, „IV ლაშქრობა“ → რიგობითი რიცხვითი სახელი
    t = re.sub(r"\b([IVX]+)(?:-([ა-ჰ]+))?(?![A-Za-z])",
               lambda m: ordinal(roman_to_int(m.group(1)), m.group(2) or ""), t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def card_segments(card):
    """[(ტექსტი, პაუზა შემდეგ, მწ)] — სათაური, სიის თითო პუნქტი, ფაქტი."""
    segs = [(speakable(card["title"].rstrip(".") + "."), PAUSE_TITLE)]
    for para in card["paragraphs"]:
        for item in re.split(r"\n|•", para):
            item = speakable(item)
            if item:
                segs.append((item, PAUSE_ITEM))
    if card["fact"]:
        segs[-1] = (segs[-1][0], PAUSE_FACT)
        segs.append((speakable("საინტერესო ფაქტი: " + card["fact"]), 0))
    return segs


def card_text(card):
    return " ".join(t for t, _ in card_segments(card))


def card_ssml(card, rate=None, pitch=None, style=None):
    rate = RATE if rate is None else rate
    pitch = PITCH if pitch is None else pitch
    style = STYLE if style is None else style
    aside = '<break time="%dms"/>' % PAUSE_ASIDE
    body = ""
    for text, pause in card_segments(card):
        x = escape(text)
        x = x.replace(" (", " " + aside + "(").replace(") ", ")" + aside + " ")
        body += x + ('<break time="%dms"/>' % pause if pause else "") + " "
    body = '<prosody rate="%s" pitch="%s">%s</prosody>' % (rate, pitch, body.strip())
    if style:
        body = '<mstts:express-as style="%s">%s</mstts:express-as>' % (style, body)
    return ('<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" '
            'xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="ka-GE">'
            '<voice name="%s">%s</voice></speak>' % (VOICE, body))


# ---------- მონაცემები ----------

def load_theory(course_id):
    data_file = os.path.join(ROOT, "js", "data", course_id + ".js")
    stub = "var window={IMS_DATA:{register:function(c){globalThis.__course=c}}};var document={};"
    out = subprocess.run([JSC, "-e", stub, data_file, os.path.join(ROOT, "tools", "dump-theory.js")],
                         capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def read_manifest():
    if not os.path.exists(MANIFEST):
        return {}
    m = re.search(r"/\* DATA \*/(.*)/\* END \*/", open(MANIFEST, encoding="utf-8").read(), re.S)
    return json.loads(m.group(1)) if m else {}


def write_manifest(data):
    body = json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True)
    open(MANIFEST, "w", encoding="utf-8").write(
        "/* ==========================================================\n"
        "   ისტორიის სამყარო — თეორიული ბარათების აუდიო (ხელოვნური ხმა)\n"
        "   ----------------------------------------------------------\n"
        "   ავტომატურად იქმნება: python3 tools/make-audio.py <კურსი> <გაკვეთილი>\n"
        "   ხელით ნუ შეცვლი. { გაკვეთილი: { ნაბიჯის ნომერი: ფაილი } }\n"
        "   ========================================================== */\n\n"
        "window.IMS_AUDIO = Object.freeze(/* DATA */" + body + "/* END */);\n")


# ---------- Azure ----------

def read_key():
    env = {}
    for line in open(KEY_FILE, encoding="utf-8"):
        if "=" in line:
            k, v = line.strip().split("=", 1)
            env[k] = v
    return env["AZURE_SPEECH_KEY"], env["AZURE_SPEECH_REGION"]


def synthesize(ssml, key, region):
    req = urllib.request.Request(
        "https://%s.tts.speech.microsoft.com/cognitiveservices/v1" % region,
        data=ssml.encode("utf-8"),
        headers={
            "Ocp-Apim-Subscription-Key": key,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
            "User-Agent": "istoriis-samyaro-tts",
        },
    )
    # უფასო ტარიფს წუთში მოთხოვნების ლიმიტი აქვს — 429-ზე ველოდებით და ვიმეორებთ
    for attempt in range(6):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                return resp.read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or attempt == 5:
                raise
            wait = int(e.headers.get("Retry-After") or 0) or 15 * (attempt + 1)
            print("… Azure-ის ლიმიტი, ველოდები %d წმ" % wait)
            time.sleep(wait)
        except (http.client.IncompleteRead, urllib.error.URLError, TimeoutError, ConnectionError) as e:
            # კავშირი შუა გზაზე გაწყდა — ცოტას ვიცდით და ვიმეორებთ
            if attempt == 5:
                raise
            print("… კავშირი გაწყდა (%s), ვიმეორებ" % type(e).__name__)
            time.sleep(5 * (attempt + 1))


# ---------- მთავარი ----------

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    only_print = "--print" in sys.argv
    if len(args) < 2:
        print(__doc__)
        sys.exit(1)
    course_id, lesson_ids = args[0], args[1:]
    theory = load_theory(course_id)
    manifest = read_manifest()
    key = region = None

    for lesson_id in lesson_ids:
        cards = theory.get(lesson_id)
        if not cards:
            print("⚠️  გაკვეთილი ვერ მოიძებნა: " + lesson_id)
            continue
        folder = os.path.join(ROOT, "assets", "audio", lesson_id)
        entries = {}
        for card in cards:
            text = card_text(card)
            if only_print:
                print("\n[%s · ნაბიჯი %d] %s" % (lesson_id, card["i"], text))
                continue
            ssml = card_ssml(card)
            digest = hashlib.sha1(ssml.encode("utf-8")).hexdigest()[:10]
            name = "%d-%s.mp3" % (card["i"], digest)
            path = os.path.join(folder, name)
            if not os.path.exists(path):
                if key is None:
                    key, region = read_key()
                os.makedirs(folder, exist_ok=True)
                audio = synthesize(ssml, key, region)
                open(path, "wb").write(audio)
                print("✓ %s/%s (%d KB)" % (lesson_id, name, len(audio) // 1024))
            else:
                print("· %s/%s უკვე არსებობს" % (lesson_id, name))
            entries[str(card["i"])] = "assets/audio/%s/%s" % (lesson_id, name)

        if only_print:
            continue
        # ძველი ვერსიების წაშლა (ტექსტი შეიცვალა → ახალი ჰეში)
        keep = {os.path.basename(p) for p in entries.values()}
        for f in os.listdir(folder):
            if f.endswith(".mp3") and f not in keep:
                os.remove(os.path.join(folder, f))
                print("✕ წაიშალა ძველი: %s/%s" % (lesson_id, f))
        manifest[lesson_id] = entries
        write_manifest(manifest)  # ყოველი გაკვეთილის შემდეგ — შეწყვეტისას ნამუშევარი არ იკარგება

    if not only_print:
        write_manifest(manifest)
        print("js/audio-manifest.js განახლდა")


if __name__ == "__main__":
    main()
