#!/usr/bin/env python3
"""Classify imported posts (facebook/hackmd) into content categories + tags.

Usage:
  python3 scripts/classify.py --dry    # report only
  python3 scripts/classify.py --apply  # rewrite category + tags in frontmatter
  python3 scripts/classify.py --rescue [--apply]
                                       # upgrade mode: only imported posts currently in
                                       # essay/shitpost, rewrites the category line only
                                       # (tags untouched); never downgrades

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
    "linux": ["linux", "arch", "btrfs", "zfs", "grub", "pacman", "systemd", "kernel", "內核", "gentoo", "debian", "ubuntu", "freebsd", "openbsd", "shell", "bash", "zsh", "vim", "neovim", "tmux", "hyprland", "wayland", "nixos", "aur", "ext4", "檔案系統", "磁碟", "開機", "驅動", "發行版", "bcachefs", "selinux", "sudo", "cron", "mount", "分區", "uefi", "雙系統", "distro", "終端機", "terminal", "kde", "plasma", "gnome", "zellij", "fastfetch", "neofetch", "distrobox", "wine", "proton", "flatpak", "apt", "dnf", "yay", "paru", "sddm", "x11", "pipewire", "networkmanager", "fcitx", "ibus", "qemu", "kvm", "virt-manager", "xfce", "藍牙", "bluetooth"],
    "self-hosting": ["docker", "compose", "k8s", "kubernetes", "nginx", "caddy", "traefik", "tunnel", "vpn", "wireguard", "tailscale", "headscale", "derp", "opnsense", "pfsense", "pve", "proxmox", "esxi", "nas", "nextcloud", "gitea", "jellyfin", "自架", "伺服器", "部署", "反向代理", "ddns", "dns", "minio", "openwrt", "quicklink", "cloudflared", "架設", "內網", "穿透", "rclone", "備份", "portainer", "casaos", "truenas", "unraid", "synology", "群暉", "adguard", "pihole", "frp", "vaultwarden", "bitwarden", "immich", "photoprism", "uptime kuma", "n8n", "authentik", "keycloak", "certbot"],
    "programming": ["python", "rust", "golang", "c++", "c語言", "javascript", "typescript", "java", "compiler", "編譯", "automata", "自動機", "正規", "regex", "演算法", "algorithm", "資料結構", "dsa", "leetcode", "程式設計", "程式", "oop", "xml", "json", "sql", "database", "資料庫", "api", "debug", "重構", "refactor", "作業", "quiz", "midterm", "final", "作業系統", "執行緒", "thread", "memory", "記憶體", "github", "git", "函式", "指標", "物件導向", "homework", "線性代數", "linear algebra", "微積分", "calculus", "離散", "discrete", "計算機", "operating system", "data structure", "recursion", "遞迴", "react", "vue", "svelte", "node", "deno", "css", "html", "php", "haskell", "kotlin", "swift", "matlab", "verilog", "組合語言", "assembly", "快取", "cache", "callback", "async", "vscode", "npm", "hackerrank"],
    "ai": ["ai", "agent", "agentic", "llm", "gpt", "chatgpt", "glm", "claude", "gemini", "opencode", "openai", "anthropic", "機器學習", "machine learning", "深度學習", "神經網路", "neural", "prompt", "rag", "fine-tune", "ollama", "cybergym", "訓練", "dataset", "模型", "人工智慧", "vibe coding", "copilot", "deepseek", "llama", "qwen", "mistral", "transformer", "embedding", "diffusion", "midjourney", "inference", "推論", "微調", "tokenizer", "mcp", "grok", "cursor", "perplexity", "notebooklm", "sora", "agi", "幻覺"],
    "security": ["資安", "security", "cve", "漏洞", "vulnerab", "exploit", "ctf", "滲透", "pentest", "malware", "釣魚", "phishing", "防火牆", "加密", "encrypt", "憑證", "certificate", "hash", "auth", "reverse shell", "權限", "xss", "sql injection", "injection", "rce", "nmap", "wireshark", "burp", "metasploit", "payload", "shellcode", "pwn", "密碼學", "cryptography", "2fa", "otp"],
    "hardware": ["裝機", "開箱", "顯卡", "gpu", "nvidia", "amd", "intel", "cpu", "ssd", "hdd", "主機板", "電源", "機殼", "鍵盤", "滑鼠", "螢幕", "效能", "benchmark", "超頻", "bios", "韌體", "firmware", "機器學習主機", "電腦", "水冷", "風扇", "computex", "筆電", "laptop", "thinkpad", "asus", "華碩", "acer", "宏碁", "lenovo", "聯想", "msi", "ryzen", "rtx", "radeon", "snapdragon", "驍龍", "iphone", "android", "小米", "pixel", "耳機", "路由器", "itx", "atx", "ddr5", "ddr4", "nvme"],
    "acg": ["遊戲", "game", "steam", "艦隊", "艦これ", "艦娘", "少女前線", "追放", "minecraft", "amiibo", "nukitashi", "galgame", "同人", "動畫", "anime", "新番", "漫畫", "manga", "聲優", "二次元", "動漫", "gacha", "課金", "抽卡", "攻略", "mod", "整合包", "vtuber", "figure", "公仔", "萌", "cosplay", "特典", "周邊", "手辦", "zelda", "薩爾達", "elden ring", "艾爾登法環", "魔物獵人", "怪物獵人", "genshin", "原神", "崩壞", "star rail", "崩鐵", "arknights", "明日方舟", "fgo", "賽馬娘", "blue archive", "蔚藍檔案", "hololive", "nijisanji", "寶可夢", "pokemon", "nintendo", "任天堂", "playstation", "ps5", "xbox"],
    "blog": ["部落格", "blog", "astro", "ssg", "seo", "hexo", "hugo", "靜態站", "pagefind"],
}
SHITPOST, ESSAY = "shitpost", "essay"
MIN_SCORE = 2  # total keyword score needed to assign a category
MAX_TAGS = 10


def kw_regex(kw: str) -> str:
    """ASCII keywords get boundaries that ignore CJK adjacency (用linux ✓, astronomy ✗)."""
    if re.fullmatch(r"[a-z0-9+\- ]+", kw):
        return r"(?<![a-z0-9])" + re.escape(kw) + r"(?![a-z])"
    return re.escape(kw)


def classify(source: str, stype: str, title: str, body: str, min_score: int = MIN_SCORE):
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
    if not scores or max(scores.values()) < min_score:
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
    rescue = "--rescue" in sys.argv
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
        if "draft: true" not in fm:
            continue  # expanded/published posts are human-curated; never re-classify
        cur = re.search(r'^category: "?([\w-]+)"?', fm, re.MULTILINE)
        if rescue and (not cur or cur.group(1) not in (SHITPOST, ESSAY)):
            continue  # rescue upgrades the two dump buckets only, never downgrades
        get = lambda k: (re.search(rf'{k}: "([^"]*)"', fm) or [None, ""])[1]  # noqa: E731
        source, stype = get("source"), get("sourceType")
        title = get("title")

        cat, tags = classify(source, stype, title, body, min_score=3)
        dist.setdefault(cat, []).append(p.name)

        if rescue:
            # category-line-only upgrade; tags and everything else untouched
            if cat in (SHITPOST, ESSAY) or not cur or cur.group(1) == cat:
                continue
            if apply:
                new_fm = re.sub(r"^category: .*$", f"category: {cat}", fm, count=1, flags=re.MULTILINE)
                if new_fm != fm:
                    p.write_text(src.replace(f"---\n{fm}\n---", f"---\n{new_fm}\n---", 1), encoding="utf-8")
                    changed += 1
            continue

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
