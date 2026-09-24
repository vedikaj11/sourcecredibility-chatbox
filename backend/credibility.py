import re
import os
import requests

from urllib.parse import urlparse
from bs4 import BeautifulSoup
from dotenv import load_dotenv

from sources import (
    TRUSTED_SOURCES,
    DEFAULT_SCORE,
    SOCIAL_PLATFORMS,
    SOCIAL_SCORE,
)

load_dotenv()

NEWS_API_KEY = os.getenv("NEWS_API_KEY")
GEMINI_API_KEY=os.getenv("GEMINI_API_KEY")


# -----------------------------
# URL / DOMAIN HELPERS
# -----------------------------

def get_domain(url: str) -> str:
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    domain = urlparse(url).netloc.lower()

    if domain.startswith("www."):
        domain = domain[4:]

    return domain


def base_score(domain: str) -> int:
    for site, score in TRUSTED_SOURCES.items():
        if domain == site or domain.endswith("." + site):
            return score

    return DEFAULT_SCORE


def social_platform(domain: str):
    for site, name in SOCIAL_PLATFORMS.items():
        if domain == site or domain.endswith("." + site):
            return name

    return None


# -----------------------------
# SCORE LABEL
# -----------------------------

def get_label(score: int) -> str:
    if score >= 75:
        return "Reliable"

    if score >= 50:
        return "Moderate"

    return "Low credibility"


# -----------------------------
# WEBSITE CHECKS
# -----------------------------

def scrape_checks(url: str):
    points = 0
    reasons = []
    breakdown = []

    if url.startswith("https://"):
        points += 5
        reasons.append("Uses HTTPS")
        breakdown.append("HTTPS: +5")

    try:
        response = requests.get(
            url,
            timeout=8,
            headers={"User-Agent": "Mozilla/5.0"}
        )
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        if (
            soup.find("meta", attrs={"name": "author"})
            or soup.find(attrs={"rel": "author"})
        ):
            points += 5
            reasons.append("Author information found")
            breakdown.append("Author information: +5")
        else:
            reasons.append("Author information not found")
            breakdown.append("Author information: +0")

        if (
            soup.find(
                "meta",
                attrs={"property": "article:published_time"}
            )
            or soup.find("time")
        ):
            points += 5
            reasons.append("Publication date found")
            breakdown.append("Publication date: +5")
        else:
            reasons.append("Publication date not found")
            breakdown.append("Publication date: +0")

        about_or_contact = soup.find(
            "a",
            href=lambda h: h and (
                "about" in h.lower()
                or "contact" in h.lower()
            )
        )

        if about_or_contact:
            points += 5
            reasons.append("About/Contact page found")
            breakdown.append("About/Contact page: +5")
        else:
            reasons.append("About/Contact page not found")
            breakdown.append("About/Contact page: +0")

    except requests.RequestException:
        reasons.append(
            "Could not open the page to verify additional details"
        )

    return points, reasons, breakdown
# -----------------------------
# URL ANALYSIS
# -----------------------------
def analyze_url(url: str) -> dict:
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    domain = get_domain(url)

    if not domain:
        return {
            "source": "Unknown",
            "score": DEFAULT_SCORE,
            "base_score": DEFAULT_SCORE,
            "label": get_label(DEFAULT_SCORE),
            "input_type": "url",
            "reasons": ["Invalid URL"],
            "score_breakdown": [
                f"Base source score: {DEFAULT_SCORE}"
            ],
        }

    platform = social_platform(domain)

    if platform:
        return {
            "source": platform,
            "score": SOCIAL_SCORE,
            "base_score": SOCIAL_SCORE,
            "label": get_label(SOCIAL_SCORE),
            "input_type": "url",
            "reasons": [
                f"{platform} is a social media platform",
                "Content is user-generated and requires independent verification",
            ],
            "score_breakdown": [
                f"Social platform base score: {SOCIAL_SCORE}"
            ],
        }

    score = base_score(domain)

    reasons = []
    score_breakdown = [
        f"Base source score: {score}"
    ]

    is_trusted = any(
        domain == site or domain.endswith("." + site)
        for site in TRUSTED_SOURCES
    )

    if is_trusted:
        reasons.append(
            f"Domain is recognized with a base credibility score of {score}"
        )
    else:
        reasons.append(
            f"Domain is not in the trusted sources list; "
            f"default score of {DEFAULT_SCORE} applied"
        )

    extra_points, extra_reasons, breakdown = scrape_checks(url)

    score += extra_points

    score = min(score, 100)

    reasons.extend(extra_reasons)
    score_breakdown.extend(breakdown)

    return {
        "source": domain,
        "score": score,
        "base_score": base_score(domain),
        "label": get_label(score),
        "input_type": "url",
        "reasons": reasons,
        "score_breakdown": score_breakdown,
    }
# -----------------------------
# TEXT SEARCH
# -----------------------------

def make_query(text: str) -> str:

    first_sentence = re.split(
        r"[.\n!?]",
        text.strip()
    )[0]

    words = re.sub(
        r"[^\w\s]",
        " ",
        first_sentence
    ).split()[:10]

    return " ".join(words)


def search_news_sources(text: str):

    if not NEWS_API_KEY:
        return None, "NewsAPI key is missing in .env"

    query = make_query(text)

    if not query:
        return None, "Could not create a search query from the provided text"

    try:

        response = requests.get(
            "https://newsapi.org/v2/everything",
            params={
                "q": query,
                "pageSize": 5,
                "language": "en",
                "sortBy": "relevancy",
                "apiKey": NEWS_API_KEY,
            },
            timeout=8,
        )

        response.raise_for_status()

        data = response.json()

        if data.get("status") != "ok":
            return None, data.get(
                "message",
                "NewsAPI returned an error"
            )

        articles = data.get("articles", [])

        matches = []

        for article in articles:

            if not article.get("url"):
                continue

            matches.append({
                "source": article.get(
                    "source",
                    {}
                ).get(
                    "name",
                    "Unknown"
                ),
                "url": article["url"],
                "title": article.get("title"),
                "publishedAt": article.get("publishedAt"),
            })

        return matches, None

    except requests.RequestException as error:

        return None, f"Could not reach NewsAPI: {str(error)}"


# -----------------------------
# TEXT ANALYSIS
# -----------------------------

def analyze_text(text: str) -> dict:

    matches, error = search_news_sources(text)

    if error:

        return {
            "source": "Unknown",
            "score": DEFAULT_SCORE,
            "label": get_label(DEFAULT_SCORE),
            "input_type": "text",
            "reasons": [error],
            "matches": [],
        }

    if not matches:

        return {
            "source": "Unknown",
            "score": DEFAULT_SCORE,
            "label": get_label(DEFAULT_SCORE),
            "input_type": "text",
            "reasons": [
                "No matching articles were found in NewsAPI"
            ],
            "matches": [],
        }

    scores = []

    for match in matches:

        domain = get_domain(match["url"])

        match["domain"] = domain

        match_score = base_score(domain)

        match["score"] = match_score

        scores.append(match_score)

    average_score = round(
        sum(scores) / len(scores)
    )

    return {
        "source": matches[0]["source"],
        "score": average_score,
        "label": get_label(average_score),
        "input_type": "text",
        "reasons": [
            f"Found {len(matches)} matching articles",
            "Score is based on the credibility weights of the matching sources",
        ],
        "matches": matches,
    }