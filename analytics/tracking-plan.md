# jiabinlu.com Tracking Plan (draft for review)

Status: approved and implemented 2026-10-26. Implementation: `public/analytics.js` (shared by the React app and every static page) with the Amplitude SDK self-hosted at `public/vendor/amplitude-min.js`; React calls it through `src/utils/analytics.ts`. Static HTML can track a click with `data-track-event="…"` plus `data-track-<property>` attributes.

## 1. Conclusions first

1. **North-star metric: weekly consulting lead intents.** Count `Contact Initiated` events (WeChat ID copied or QR long-pressed), plus the conversion rate from a services page view to that event. Everything else on the site exists to feed this number or to grow the audience behind it.
2. **Use about ten custom events, with properties doing the detail work.** Today there are seven `services_*` events, each named after the page. They should merge into generic events that carry `page_type` and `location`, so the same event works on the homepage, blog posts and AI 实干派 without inventing new names.
3. **Naming: Amplitude style, converted automatically for GA.** Amplitude gets `Title Case Object + Past Verb` (`Contact Initiated`). GA event names can't contain spaces, so the same `track()` call sends `contact_initiated` to GA. The key conversions are also sent under GA's recommended names (`generate_lead`, `sign_up`) so GA's built-in reports pick them up.
4. **The biggest gap is coverage, not naming.** About 100 static pages load no tracking at all: every AI 实干派 page (daily digests, items, categories, subscribe, podcast), the decks, and the Fix Clipboard landing page. A shared `/analytics.js` snippet fixes this.
5. **WeChat traffic arrives without a referrer, so links need UTM tags.** Without them, every visitor from WeChat shows up as "direct". §5 defines a short UTM convention for every place you share links.

## 2. What the business needs to know

| Question | Answered by |
|---|---|
| How many people showed intent to book this week, and from which channel? | `Contact Initiated` by `initial_utm_source` |
| What share of services page visitors reach pricing, and what share then reach out? | Funnel: `Page Viewed` (services) → `Section Viewed` (pricing) → `Contact Initiated` |
| Which blog posts send readers to the services page? | Path analysis: `Page Viewed` (blog_post) → `Page Viewed` (services) |
| What objections do visitors have? | `FAQ Opened` by `question_id` |
| Is the audience growing? | `Newsletter Signup Submitted` by `list` and `location` |
| Are people reading, or bouncing? | `Article Read` (50% and 90% depth) by `post_slug` |
| Is AI 实干派 worth the daily effort? | `Page Viewed` (ai_practice_*), `Newsletter Signup Submitted` (list = ai_practice) |
| Does Fix Clipboard get downloads? | `Product Download Clicked` |

## 3. Events

Every event carries the global properties in §4. "GA name" is generated automatically from the Amplitude name unless a GA recommended event is listed.

### Lead funnel (highest priority)

| Event (Amplitude) | GA name | Fires when | Properties |
|---|---|---|---|
| `Page Viewed` | `page_view` (reserved by GA) | Every route change and every static page load | `page_type`, `page_path`, `page_title`, `post_slug`?, `post_category`? |
| `Section Viewed` | `section_viewed` | A tracked section first reaches the middle of the screen, once per page view | `section`: testimonials, layers, why_me, pricing, faq, book |
| `Booking CTA Clicked` | `booking_cta_clicked` | Any "预约咨询" button or the 咨询 nav link | `location`: hero, sticky_bar, nav, nav_mobile |
| `Contact Initiated` | `contact_initiated` + `generate_lead` | Copy WeChat ID, QR long-press, email, LinkedIn, X | `method`: wechat_id_copy, wechat_qr_longpress, email, linkedin, x; `location`: book, wechat_cta, home_hero, author_box; `result`: success, failed (`generate_lead` and `has_contacted` only on success) |
| `FAQ Opened` | `faq_opened` | An FAQ item is expanded | `question_id` (faq1..faq6), `question_text` |

### Audience and content

| Event | GA name | Fires when | Properties |
|---|---|---|---|
| `CTA Clicked` | `cta_clicked` | Secondary CTAs | `cta_id`: read_case, view_deck, follow_wechat_mp, follow_xiaohongshu, rss; `location`; `destination_path` |
| `Newsletter Signup Submitted` | `newsletter_signup_submitted` + `sign_up` | Buttondown form submitted (the form posts away, so this records intent, not confirmation) | `list`: jiabinlu, ai_practice; `location`: home, article_end, ai_practice_subscribe |
| `Article Read` | `article_read` | Reader scrolls past 50% and 90% of a post body | `post_slug`, `post_category`, `depth`: 50, 90 |
| `Language Switched` | `language_switched` | 中文/EN toggle | `from`, `to` |

### Products and media

| Event | GA name | Fires when | Properties |
|---|---|---|---|
| `Product Download Clicked` | `product_download_clicked` + `file_download` | Fix Clipboard .dmg link | `product`: fix_clipboard; `version` |

Outbound links (gtm-pod.com, contentseed, GitHub) are left to Amplitude Autocapture and GA Enhanced Measurement rather than custom events.

## 4. Properties

**Global event properties**, added by `track()` on every event:

| Property | Values |
|---|---|
| `page_type` | home, blog_list, blog_post, books, services, products, product_landing, ai_practice_home, ai_practice_digest, ai_practice_item, ai_practice_category, ai_practice_subscribe, deck, other |
| `language` | zh, en (site language toggle, not browser locale) |

**User properties:**

| Property | Source |
|---|---|
| `initial_utm_source`, `initial_utm_medium`, `initial_utm_campaign`, `initial_referring_domain` | Amplitude web attribution, on by default in the SDK |
| `language` | Set on load and on `Language Switched` |
| `has_contacted` | Set to true on the first `Contact Initiated`, for "visitors who became leads" cohorts |

## 5. UTM convention for shared links

WeChat's in-app browser sends no referrer, so a link without UTM tags is counted as direct traffic.

| Where you share | `utm_source` | `utm_medium` |
|---|---|---|
| WeChat chat or group | wechat | chat |
| WeChat Moments | wechat | moments |
| 公众号 article | wechat_mp | article |
| 小红书 | xiaohongshu | post |
| Circle / Superlinear | circle | post |
| Buttondown newsletter | buttondown | email |
| LinkedIn / X | linkedin / x | social |

`utm_campaign` is the content slug, for example `services` or `ai-consulting-say-no`. Example: `https://www.jiabinlu.com/services/?utm_source=wechat&utm_medium=moments&utm_campaign=services`.

## 6. Migration from today's events (live today)

| Live today | Becomes |
|---|---|
| `Page Viewed` / `page_view` | Same names, plus `page_type` and `language` |
| `services_section_view` {section} | `Section Viewed` {section} |
| `services_book_click` {location} | `Booking CTA Clicked` {location} |
| `services_wechat_copy` {result} | `Contact Initiated` {method: wechat_id_copy, result} |
| `services_qr_longpress` | `Contact Initiated` {method: wechat_qr_longpress} |
| `services_faq_open` {question} | `FAQ Opened` {question_id} |
| `services_case_click` {location} | `CTA Clicked` {cta_id: read_case, location} |
| `services_deck_click` | `CTA Clicked` {cta_id: view_deck} |

The old events have only been live for a few hours, so renaming them now costs almost no history.

## 7. Implementation phases

1. **P0, React pages:** rename to the new events, add the global properties, add the GA recommended-event mapping, and track the homepage and blog CTAs (`WeChatCTA`, `SubscribeCTA`, email/LinkedIn/X links).
2. **P1, engagement:** `Article Read`, `Language Switched`, `Newsletter Signup Submitted`.
3. **P2, static pages:** ship `public/analytics.js` (same IDs, same `page_type` logic) and include it in the AI 实干派 build templates (`ai-practice/scripts`), the decks and the Fix Clipboard page. Add `Product Download Clicked`. (`Podcast Played` was dropped: the site has no audio player; episodes are only consumed through the feed.)
4. **Ongoing:** this file is the source of truth. Add an event here before adding it to code.

## 8. Decisions for you

1. **Amplitude Autocapture.** It is off today. Turning on element clicks and form interactions gives a safety net for anything not listed here, at the cost of noisier data. Recommendation: on, with the custom events above as the trusted set.
2. **Amplitude Data and Ampli.** The `ampli` CLI (installed, v1.36.6) can generate a typed tracking library from a plan stored in Amplitude Data, and `ampli status` can then check the code against it. That needs you to log in (`ampli login`) and create the plan in Amplitude Data. For about ten events, plain `track()` plus this file is enough. Recommendation: skip Ampli for now.
3. **The `has_contacted` user property.** It makes lead cohorts easy, but it marks individual visitors as leads. It is fine for analytics, but confirm you are comfortable with it.
