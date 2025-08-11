import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";

// Scraping request schema
export const scrapeRequestSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  generateArticle: z.boolean().default(true),
  generateBreadcrumb: z.boolean().default(true),
  generateFaq: z.boolean().default(true),
});

export type ScrapeRequest = z.infer<typeof scrapeRequestSchema>;

// Extracted data schema
export const extractedDataSchema = z.object({
  title: z.string(),
  description: z.string(),
  author: z.string().optional(),
  datePublished: z.string().optional(),
  dateModified: z.string().optional(),
  image: z.object({
    url: z.string(),
    width: z.number().optional(),
    height: z.number().optional(),
  }).optional(),
  articleSection: z.string().optional(),
  articleBody: z.string().optional(),
  breadcrumbs: z.array(z.object({
    name: z.string(),
    url: z.string(),
    position: z.number(),
  })),
  faqs: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })),
  publisherName: z.string().optional(),
  publisherLogo: z.string().optional(),
  authorUrl: z.string().optional(),
});

export type ExtractedData = z.infer<typeof extractedDataSchema>;

// Schema generation response
export const schemaResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    extractedData: extractedDataSchema,
    schemas: z.object({
      article: z.record(z.any()).optional(),
      breadcrumb: z.record(z.any()).optional(),
      faq: z.record(z.any()).optional(),
    }),
  }).optional(),
  error: z.string().optional(),
});

export type SchemaResponse = z.infer<typeof schemaResponseSchema>;
