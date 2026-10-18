"""Package the canonical Data app build with the owner's Google Analytics tag."""
from pathlib import Path
import hashlib
import json
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
MEASUREMENT_ID = "G-358D960PXL"
GOOGLE_TAG = """<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-358D960PXL"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-358D960PXL');
</script>"""


def add_google_tag(html):
    heads = list(re.finditer(r"<head(?:\s[^>]*)?>", html, re.IGNORECASE))
    if len(heads) != 1:
        raise ValueError("Expected exactly one HTML head")
    if GOOGLE_TAG in html:
        if html.count(GOOGLE_TAG) != 1:
            raise ValueError("Duplicate Google tag")
        if not html[heads[0].end():].lstrip().startswith(GOOGLE_TAG):
            raise ValueError("Google tag must immediately follow the head element")
        return html
    if "googletagmanager.com/gtag/js" in html:
        raise ValueError("Another Google tag is already present")
    end = heads[0].end()
    return html[:end] + "\n" + GOOGLE_TAG + html[end:]


def package(root=ROOT):
    root = Path(root)
    source = root / "portfolio/dist"
    release = root / "portfolio/release"
    build = json.loads((source / "data-app-build.json").read_text())
    html_record = build["html"]
    raw = (source / html_record["path"]).read_bytes()
    if hashlib.sha256(raw).hexdigest() != html_record["sha256"]:
        raise ValueError("Canonical build HTML does not match its manifest")
    snapshot = build["snapshot"]
    snapshot_path = source / snapshot["path"]
    if hashlib.sha256(snapshot_path.read_bytes()).hexdigest() != snapshot["sha256"]:
        raise ValueError("Canonical build snapshot does not match its manifest")
    tagged = add_google_tag(raw.decode("utf-8")).encode("utf-8")
    release.mkdir(exist_ok=True)
    if {p.name for p in release.glob("*.html")} - {html_record["path"]}:
        raise ValueError("Unexpected HTML page in the public release")
    (release / html_record["path"]).write_bytes(tagged)
    shutil.copyfile(snapshot_path, release / snapshot["path"])
    html_record.update(sha256=hashlib.sha256(tagged).hexdigest(), bytes=len(tagged))
    build["analytics"] = {"provider": "Google Analytics 4", "measurementId": MEASUREMENT_ID}
    (release / "data-app-build.json").write_text(json.dumps(build, indent=2) + "\n")
    return {"html": html_record["path"], "measurementId": MEASUREMENT_ID, "sha256": html_record["sha256"]}


if __name__ == "__main__":
    print(json.dumps(package(), indent=2))
