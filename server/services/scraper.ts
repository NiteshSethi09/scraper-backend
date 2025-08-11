import * as cheerio from "cheerio";
import { ExtractedData } from "../../shared/schema";

export class WebScraper {
  async scrapeUrl(url: string): Promise<ExtractedData> {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate, br",
          DNT: "1",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const extractedData = this.extractMetadata($, url);
      return extractedData;
    } catch (error) {
      throw new Error(
        `Failed to scrape URL: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private extractMetadata($: cheerio.CheerioAPI, url: string): ExtractedData {
    // Extract title
    const title = this.extractTitle($);

    // Extract description
    const description = this.extractDescription($);

    // Extract author
    const author = this.extractAuthor($);

    // Extract dates
    const { datePublished, dateModified } = this.extractDates($);

    // Extract image
    const image = this.extractImage($, url);

    // Extract article section
    const articleSection = this.extractArticleSection($);

    // Extract article body
    const articleBody = this.extractArticleBody($);

    // Extract breadcrumbs
    const breadcrumbs = this.extractBreadcrumbs($, url);

    // Extract FAQs
    const faqs = this.extractFaqs($);

    // Extract publisher info
    const { publisherName, publisherLogo } = this.extractPublisher($);

    // Extract author URL
    const authorUrl = this.extractAuthorUrl($, url);

    return {
      title,
      description,
      author,
      datePublished,
      dateModified,
      image,
      articleSection,
      articleBody,
      breadcrumbs,
      faqs,
      publisherName,
      publisherLogo,
      authorUrl,
    };
  }

  private extractTitle($: cheerio.CheerioAPI): string {
    // Try multiple selectors for title
    const selectors = [
      "h1",
      "title",
      '[property="og:title"]',
      '[name="twitter:title"]',
      ".article-title",
      ".post-title",
      ".entry-title",
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        return element.attr("content") || element.text().trim();
      }
    }

    return "Untitled";
  }

  private extractDescription($: cheerio.CheerioAPI): string {
    // Try multiple selectors for description
    const selectors = [
      '[name="description"]',
      '[property="og:description"]',
      '[name="twitter:description"]',
      ".article-description",
      ".post-excerpt",
      ".entry-summary",
      "p",
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        const content = element.attr("content") || element.text().trim();
        if (content && content.length > 20) {
          return (
            content.substring(0, 300) + (content.length > 300 ? "..." : "")
          );
        }
      }
    }

    return "";
  }

  private extractAuthor($: cheerio.CheerioAPI): string | undefined {
    const selectors = [
      '[rel="author"]',
      '[property="article:author"]',
      '[name="author"]',
      ".author",
      ".byline",
      ".article-author",
      ".post-author",
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        const content = element.attr("content") || element.text().trim();
        if (content) {
          return content;
        }
      }
    }

    return undefined;
  }

  private extractDates($: cheerio.CheerioAPI): {
    datePublished?: string;
    dateModified?: string;
  } {
    const publishedSelectors = [
      '[property="article:published_time"]',
      '[name="publishdate"]',
      "time[datetime]",
      ".published",
      ".date",
    ];

    const modifiedSelectors = [
      '[property="article:modified_time"]',
      '[name="modifieddate"]',
      ".updated",
      ".modified",
    ];

    let datePublished: string | undefined;
    let dateModified: string | undefined;

    for (const selector of publishedSelectors) {
      const element = $(selector).first();
      if (element.length) {
        datePublished =
          element.attr("content") ||
          element.attr("datetime") ||
          element.text().trim();
        if (datePublished) break;
      }
    }

    for (const selector of modifiedSelectors) {
      const element = $(selector).first();
      if (element.length) {
        dateModified =
          element.attr("content") ||
          element.attr("datetime") ||
          element.text().trim();
        if (dateModified) break;
      }
    }

    return {
      datePublished: datePublished ? this.formatDate(datePublished) : undefined,
      dateModified: dateModified ? this.formatDate(dateModified) : undefined,
    };
  }

  private extractImage($: cheerio.CheerioAPI, baseUrl: string) {
    const selectors = [
      '[property="og:image"]',
      '[name="twitter:image"]',
      "article img",
      ".featured-image img",
      ".post-image img",
      "img",
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        const src = element.attr("content") || element.attr("src");
        if (src) {
          const absoluteUrl = this.makeAbsoluteUrl(src, baseUrl);
          const width = element.attr("width")
            ? parseInt(element.attr("width")!)
            : undefined;
          const height = element.attr("height")
            ? parseInt(element.attr("height")!)
            : undefined;

          return {
            url: absoluteUrl,
            width: width || 940,
            height: height || 564,
          };
        }
      }
    }

    return undefined;
  }

  private extractArticleSection($: cheerio.CheerioAPI): string | undefined {
    const selectors = [
      '[property="article:section"]',
      ".category",
      ".section",
      ".article-category",
      ".post-category",
      "nav .breadcrumb a:last-of-type",
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        const content = element.attr("content") || element.text().trim();
        if (content) {
          return content;
        }
      }
    }

    return undefined;
  }

  private extractArticleBody($: cheerio.CheerioAPI): string | undefined {
    // Try multiple approaches to get the full article content

    // First, try to find paragraph elements within article containers
    const contentSelectors = [
      "article p",
      ".post-content p",
      ".entry-content p",
      ".article-content p",
      ".content p",
      "main p",
    ];

    let fullText = "";

    // Try to extract all paragraphs from the main content area
    for (const selector of contentSelectors) {
      const paragraphs = $(selector);
      if (paragraphs.length > 5) {
        // Ensure we have substantial content
        let combinedText = "";
        paragraphs.each((index, elem) => {
          const text = $(elem).text().trim();
          if (text.length > 20) {
            // Filter out very short paragraphs
            combinedText += text + " ";
          }
        });

        if (combinedText.length > fullText.length) {
          fullText = combinedText;
        }
      }
    }

    // If paragraph extraction didn't work well, fall back to container extraction
    if (fullText.length < 500) {
      const containerSelectors = [
        '[property="articleBody"]',
        ".article-body",
        ".post-body",
        ".entry-body",
        ".article-content",
        ".post-content",
        ".entry-content",
        ".content-area",
        ".main-content",
        "article",
        ".content",
        "main",
      ];

      for (const selector of containerSelectors) {
        const element = $(selector).first();
        if (element.length) {
          const contentElement = element.clone();

          // Remove unwanted elements
          contentElement
            .find(
              "script, style, nav, header, footer, .navigation, .breadcrumb, .social-share, .comments, .sidebar, .related-posts, .author-box, .tags, .categories, .meta, .advertisement, .ads, .social-media, .share-buttons"
            )
            .remove();

          const content = contentElement.text().trim();
          const cleanContent = content.replace(/\s+/g, " ").trim();

          if (
            cleanContent.length > fullText.length &&
            cleanContent.length > 200
          ) {
            fullText = cleanContent;
          }
        }
      }
    }

    if (fullText.length > 200) {
      // Clean up the text and return the complete content without any character limits
      const cleanText = fullText.replace(/\s+/g, " ").trim();
      return cleanText;
    }

    return undefined;
  }

  private extractBreadcrumbs(
    $: cheerio.CheerioAPI,
    url: string
  ): Array<{ name: string; url: string; position: number }> {
    const breadcrumbs: Array<{ name: string; url: string; position: number }> =
      [];

    // Try to find structured breadcrumbs first
    const breadcrumbSelectors = [
      ".breadcrumb a",
      ".breadcrumbs a",
      '[typeof="BreadcrumbList"] a',
      'nav[aria-label*="bread" i] a',
    ];

    let found = false;
    for (const selector of breadcrumbSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        elements.each((index, element) => {
          const $el = $(element);
          const text = $el.text().trim();
          const href = $el.attr("href");
          if (text && href) {
            let absoluteUrl = this.makeAbsoluteUrl(href, url);
            // Add trailing slash for directory-like paths (but not for the final item)
            if (
              index < elements.length - 1 &&
              !absoluteUrl.endsWith("/") &&
              !absoluteUrl.includes("?") &&
              !absoluteUrl.includes("#")
            ) {
              absoluteUrl += "/";
            }
            breadcrumbs.push({
              name: text,
              url: absoluteUrl,
              position: index + 1,
            });
          }
        });
        found = true;
        break;
      }
    }

    // If no structured breadcrumbs found, create from URL
    if (!found) {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname
        .split("/")
        .filter((segment) => segment.length > 0);

      // Add home
      breadcrumbs.push({
        name: "Home",
        url: `${urlObj.protocol}//${urlObj.host}`,
        position: 1,
      });

      // Add path segments
      let currentPath = "";
      pathSegments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        const name = segment
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
        // Add trailing slash for directory-like paths (not for the final article page)
        const urlPath =
          index < pathSegments.length - 1 ? `${currentPath}/` : currentPath;
        breadcrumbs.push({
          name: name,
          url: `${urlObj.protocol}//${urlObj.host}${urlPath}`,
          position: index + 2,
        });
      });
    }

    return breadcrumbs;
  }

  private extractPublisher($: cheerio.CheerioAPI): {
    publisherName?: string;
    publisherLogo?: string;
  } {
    const nameSelectors = [
      '[property="og:site_name"]',
      ".site-name",
      ".site-title",
      'meta[name="application-name"]',
    ];

    const logoSelectors = [
      'link[rel="icon"]',
      'link[rel="apple-touch-icon"]',
      ".logo img",
      ".site-logo img",
    ];

    let publisherName: string | undefined;
    let publisherLogo: string | undefined;

    for (const selector of nameSelectors) {
      const element = $(selector).first();
      if (element.length) {
        publisherName = element.attr("content") || element.text().trim();
        if (publisherName) break;
      }
    }

    for (const selector of logoSelectors) {
      const element = $(selector).first();
      if (element.length) {
        publisherLogo = element.attr("href") || element.attr("src");
        if (publisherLogo) break;
      }
    }

    return { publisherName, publisherLogo };
  }

  private extractAuthorUrl(
    $: cheerio.CheerioAPI,
    baseUrl: string
  ): string | undefined {
    const selectors = [
      '[rel="author"]',
      ".author a",
      ".byline a",
      ".article-author a",
      ".post-author a",
      ".entry-author a",
      'a[href*="/author/"]',
      'a[href*="/authors/"]',
      ".author-info a",
      ".author-name a",
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length && element.attr("href")) {
        const href = element.attr("href")!;
        return this.makeAbsoluteUrl(href, baseUrl);
      }
    }

    return undefined;
  }

  private extractFaqs(
    $: cheerio.CheerioAPI
  ): { question: string; answer: string }[] {
    const faqs: { question: string; answer: string }[] = [];

    // Common FAQ patterns and selectors
    const faqSelectors = [
      // Standard FAQ sections
      ".faq-item, .faq-question, .faq-entry",
      ".accordion-item, .accordion",
      '[class*="faq"] [class*="item"]',
      '[class*="faq"] dt, [class*="faq"] dd',

      // Question/Answer patterns
      ".question, .answer",
      ".qa-item, .qa-pair",
      '[class*="question"], [class*="answer"]',

      // Details/Summary HTML5 elements
      "details summary, details",

      // Heading + paragraph patterns
      "h3 + p, h4 + p, h5 + p",
      "h3 + div, h4 + div, h5 + div",

      // Schema.org structured data
      '[itemtype*="Question"], [itemtype*="Answer"]',
    ];

    // Method 1: Try structured FAQ sections
    $(".faq-item, .faq-question, .faq-entry, .accordion-item").each(
      (_, element) => {
        const $item = $(element);

        // Look for question and answer within the item
        const questionSelectors = [
          "h3, h4, h5, h6",
          ".question",
          ".faq-question",
          "summary",
          '[class*="question"]',
        ];
        const answerSelectors = [
          "p, div:not(.question)",
          ".answer",
          ".faq-answer",
          '[class*="answer"]',
        ];

        let question = "";
        let answer = "";

        for (const qSelector of questionSelectors) {
          const qElement = $item.find(qSelector).first();
          if (qElement.length && qElement.text().trim()) {
            question = qElement.text().trim();
            break;
          }
        }

        for (const aSelector of answerSelectors) {
          const aElement = $item.find(aSelector).first();
          if (
            aElement.length &&
            aElement.text().trim() &&
            aElement.text().trim() !== question
          ) {
            answer = aElement.text().trim();
            break;
          }
        }

        if (question && answer && question !== answer) {
          faqs.push({ question, answer });
        }
      }
    );

    // Method 2: Try details/summary elements
    if (faqs.length === 0) {
      $("details").each((_, element) => {
        const $details = $(element);
        const question = $details.find("summary").first().text().trim();
        const $content = $details.clone();
        $content.find("summary").remove();
        const answer = $content.text().trim();

        if (question && answer && question !== answer) {
          faqs.push({ question, answer });
        }
      });
    }

    // Method 3: Try question headers followed by content
    if (faqs.length === 0) {
      $("h3, h4, h5, h6").each((_, element) => {
        const $heading = $(element);
        const headingText = $heading.text().trim();

        // Check if heading looks like a question
        if (
          headingText.includes("?") ||
          headingText.toLowerCase().includes("what") ||
          headingText.toLowerCase().includes("how") ||
          headingText.toLowerCase().includes("why") ||
          headingText.toLowerCase().includes("when") ||
          headingText.toLowerCase().includes("where") ||
          headingText.toLowerCase().includes("can") ||
          headingText.toLowerCase().includes("will") ||
          headingText.toLowerCase().includes("should") ||
          headingText.toLowerCase().includes("do ") ||
          headingText.toLowerCase().includes("does ") ||
          headingText.toLowerCase().includes("is ")
        ) {
          // Get the next element as potential answer
          const $next = $heading.next();
          if ($next.length && ($next.is("p") || $next.is("div"))) {
            const answer = $next.text().trim();
            if (answer && answer !== headingText && answer.length > 20) {
              faqs.push({ question: headingText, answer });
            }
          }
        }
      });
    }

    // Method 4: Try to find FAQ in JSON-LD structured data
    if (faqs.length === 0) {
      $('script[type="application/ld+json"]').each((_, element) => {
        try {
          const data = JSON.parse($(element).html() || "");
          if (data["@type"] === "FAQPage" && data.mainEntity) {
            data.mainEntity.forEach((item: any) => {
              if (
                item["@type"] === "Question" &&
                item.name &&
                item.acceptedAnswer
              ) {
                const question = item.name;
                const answer =
                  item.acceptedAnswer.text || item.acceptedAnswer.name || "";
                if (question && answer) {
                  faqs.push({ question, answer });
                }
              }
            });
          }
        } catch (e) {
          // Ignore JSON parsing errors
        }
      });
    }

    // Clean up and deduplicate FAQs
    const uniqueFaqs = faqs.filter(
      (faq, index, self) =>
        index ===
        self.findIndex(
          (f) => f.question.toLowerCase() === faq.question.toLowerCase()
        )
    );

    return uniqueFaqs.slice(0, 20); // Limit to 20 FAQs to avoid too much data
  }

  private makeAbsoluteUrl(url: string, baseUrl: string): string {
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return url;
    }
  }

  private formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return dateStr;
      }
      return date.toISOString();
    } catch {
      return dateStr;
    }
  }
}
