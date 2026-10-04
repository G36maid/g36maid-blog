#!/usr/bin/env python3
"""Classify imported posts (facebook/hackmd) into content categories + tags.

Usage:
  python3 scripts/classify.py --dry    # report only
  python3 scripts/classify.py --apply  # rewrite category + tags in frontmatter

- Primary category: keyword score winner (title ×3 weight).
- Tags: ALL matched keywords across categories (overlaps welcome — they become
  SEO entry points), capped at 10, merged with any existing frontmatter tags.
- Super-short posts with no keyword signal → shitpost; longer unmatched → essay.

Taxonomy follows ivonblog granularity, adapted to this blog's content.
Display labels live in src/lib/content.ts (CATEGORY_LABELS).
"""
import re
import sys
from collections import Counter
from pathlib import Path

POSTS = Path(__file__).resolve().parent.parent / "src/content/post"

LIFE_PAT = r"生日|就讀|畢業|錄取|考上|辭掉|離職|開始在.{0,12}的新工作|開始就讀"
WORK_PAT = r"例會|週報|會議記錄|會議紀錄|結業報告|結業|實習|履歷|職涯|面試|drill|moxa"

CATS = {
    "linux": ["linux", "arch", "btrfs", "zfs", "grub", "pacman", "systemd", "kernel", "內核", "gentoo", "debian", "ubuntu", "freebsd", "openbsd", "shell", "bash", "zsh", "vim", "neovim", "tmux", "hyprland", "wayland", "nixos", "aur", "ext4", "檔案系統", "磁碟", "開機", "驅動", "發行版", "bcachefs", "selinux", "sudo", "cron", "mount", "分區", "uefi", "雙系統", "distro", "終端機", "terminal"],
    "self-hosting": ["docker", "compose", "k8s", "kubernetes", "nginx", "caddy", "traefik", "tunnel", "vpn", "wireguard", "tailscale", "headscale", "derp", "opnsense", "pfsense", "pve", "proxmox", "esxi", "nas", "nextcloud", "gitea", "jellyfin", "自架", "伺服器", "部署", "反向代理", "ddns", "dns", "minio", "openwrt", "quicklink", "cloudflared", "架設", "內網", "穿透", "rclone", "備份"],
    "programming": ["python", "rust", "golang", "c++", "c語言", "javascript", "typescript", "java", "compiler", "編譯", "automata", "自動機", "正規", "regex", "演算法", "algorithm", "資料結構", "dsa", "leetcode", "程式設計", "程式", "oop", "xml", "json", "sql", "database", "資料庫", "api", "debug", "重構", "refactor", "作業", "quiz", "midterm", "final", "作業系統", "執行緒", "thread", "memory", "記憶體", "github", "git", "函式", "指標", "物件導向"],
    "ai": ["ai", "agent", "agentic", "llm", "gpt", "chatgpt", "glm", "claude", "gemini", "opencode", "openai", "anthropic", "機器學習", "machine learning", "深度學習", "神經網路", "neural", "prompt", "rag", "fine-tune", "ollama", "cybergym", "訓練", "dataset", "模型", "人工智慧", "vibe coding", "copilot"],
    "security": ["資安", "security", "cve", "漏洞", "vulnerab", "exploit", "ctf", "滲透", "pentest", "malware", "釣魚", "phishing", "防火牆", "加密", "encrypt", "憑證", "certificate", "hash", "auth", "reverse shell", "權限"],
    "hardware": ["裝機", "開箱", "顯卡", "gpu", "nvidia", "amd", "intel", "cpu", "ssd", "hdd", "主機板", "電源", "機殼", "鍵盤", "滑鼠", "螢幕", "效能", "benchmark", "超頻", "bios", "韌體", "firmware", "機器學習主機", "電腦", "水冷", "風扇"],
    "acg": ["遊戲", "game", "steam", "艦隊", "艦これ", "艦娘", "少女前線", "追放", "minecraft", "amiibo", "nukitashi", "galgame", "同人", "動畫", "anime", "新番", "漫畫", "manga", "聲優", "二次元", "動漫", "gacha", "課金", "抽卡", "攻略", "mod", "整合包", "vtuber", "figure", "公仔", "萌", "cosplay", "特典", "周邊", "手辦"],
    "blog": ["部落格", "blog", "astro", "ssg", "seo", "hexo", "hugo", "靜態站"],
}
SHITPOST, ESSAY = "shitpost", "essay"
MIN_SCORE = 2  # total keyword score needed to assign a category
MAX_TAGS = 10


def kw_regex(kw: str) -> str:
    """ASCII keywords get boundaries that ignore CJK adjacency (用linux ✓, astronomy ✗)."""
    if re.fullmatch(r"[a-z0-9+\- ]+", kw):
        return r"(?<![a-z0-9])" + re.escape(kw) + r"(?![a-z])"
    return re.escape(kw)


def classify(source: str, stype: str, title: str, body: str):
    """→ (category, tags:list[str])"""
    text = (title * 3 + "\n" + body).lower()
    if stype == "生活大事" or re.search(LIFE_PAT, title):
        return "life", []
    if re.search(WORK_PAT, title) or (source == "hackmd" and re.search(WORK_PAT, body[:300])):
        return "work", []

    scores, hits = {}, {}
    for slug, kws in CATS.items():
        c = Counter()
        for kw in kws:
            n = len(re.findall(kw_regex(kw), text))
            if n:
                c[kw] = n
        if c:
            scores[slug] = sum(c.values())
            hits[slug] = c
    if not scores or max(scores.values()) < MIN_SCORE:
        return (SHITPOST if len(body.strip()) < 60 else ESSAY), []

    primary = max(scores, key=lambda s: (scores[s], -list(CATS).index(s)))

    # tags = every keyword that appeared, weighted by frequency, best 10
    tag_counter = Counter()
    for slug, c in hits.items():
        tag_counter.update(c)
    tags = [kw for kw, _ in tag_counter.most_common(MAX_TAGS)]
    return primary, tags


def main() -> None:
    apply = "--apply" in sys.argv
    dist: dict[str, list] = {}
    changed = 0
    for p in sorted(POSTS.glob("*.md")):
        src = p.read_text(encoding="utf-8")
        m = re.match(r"^---\n(.*?)\n---\n(.*)", src, re.DOTALL)
        if not m:
            continue
        fm, body = m.groups()
        if not re.search(r'source: "(?:facebook|hackmd)"', fm):
            continue  # original posts keep their hand-set categories
        get = lambda k: (re.search(rf'{k}: "([^"]*)"', fm) or [None, ""])[1]  # noqa: E731
        source, stype = get("source"), get("sourceType")
        title = get("title")

        cat, tags = classify(source, stype, title, body)
        dist.setdefault(cat, []).append(p.name)

        # merge classifier tags with existing frontmatter tags
        tm = re.search(r"^tags: \[(.*)\]$", fm, re.MULTILINE)
        existing = [t.strip().strip('"') for t in tm.group(1).split(",") if t.strip()] if tm else []
        merged = list(dict.fromkeys(existing + tags))[:MAX_TAGS + 4]
        tags_yaml = "[" + ", ".join(f'"{t}"' for t in merged) + "]"

        if apply:
            new_fm = fm
            new_fm = (re.sub(r"^category: .*$", f"category: {cat}", new_fm, count=1, flags=re.MULTILINE)
                      if re.search(r"^category: .*$", new_fm, re.MULTILINE)
                      else new_fm + f"\ncategory: {cat}")
            if tm:
                new_fm = new_fm.replace(tm.group(0), f"tags: {tags_yaml}", 1)
            else:
                new_fm += f"\ntags: {tags_yaml}"
            if new_fm != fm:
                p.write_text(src.replace(f"---\n{fm}\n---", f"---\n{new_fm}\n---", 1), encoding="utf-8")
                changed += 1

    total = sum(len(v) for v in dist.values())
    print(f"== {'APPLIED' if apply else 'DRY RUN'}: {total} posts, {changed} changed ==")
    for cat in sorted(dist, key=lambda c: -len(dist[c])):
        print(f"{cat:14} {len(dist[cat]):5}")
        for name in dist[cat][:3]:
            print(f"    · {name[:56]}")


if __name__ == "__main__":
    main()
