import { ExtractedData } from "../../shared/schema";

export class SchemaGenerator {
  generateArticleSchema(data: ExtractedData, url: string) {
    const schema: any = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: data.title,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": url,
      },
    };

    if (data.description) {
      schema.description = data.description;
    }

    if (data.image) {
      schema.image = {
        "@type": "ImageObject",
        url: data.image.url,
        ...(data.image.height && { height: data.image.height }),
        ...(data.image.width && { width: data.image.width }),
      };
    }

    if (data.author) {
      schema.author = {
        "@type": "Person",
        name: data.author,
        ...(data.authorUrl && { url: data.authorUrl }),
      };
    }

    if (data.publisherName) {
      schema.publisher = {
        "@type": "Organization",
        name: data.publisherName,
        ...(data.publisherLogo && {
          logo: {
            "@type": "ImageObject",
            url: data.publisherLogo,
          },
        }),
      };
    }

    if (data.datePublished) {
      schema.datePublished = data.datePublished;
    }

    if (data.dateModified) {
      schema.dateModified = data.dateModified;
    }

    if (data.articleSection) {
      schema.articleSection = data.articleSection;
    }

    if (data.articleBody) {
      schema.articleBody = data.articleBody;
    }

    return schema;
  }

  generateBreadcrumbSchema(data: ExtractedData) {
    if (!data.breadcrumbs || data.breadcrumbs.length === 0) {
      return null;
    }

    const schema = {
      "@context": "https://schema.org/",
      "@type": "BreadcrumbList",
      name: data.title,
      itemListElement: data.breadcrumbs.map((breadcrumb) => ({
        "@type": "ListItem",
        position: breadcrumb.position.toString(),
        item: {
          "@id": breadcrumb.url,
          name: breadcrumb.name,
        },
      })),
    };

    return schema;
  }

  generateFaqSchema(data: ExtractedData) {
    if (!data.faqs || data.faqs.length === 0) {
      return null;
    }

    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: data.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    };

    return schema;
  }
}
