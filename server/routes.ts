import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebScraper } from "./services/scraper";
import { SchemaGenerator } from "./services/schemaGenerator";
import { scrapeRequestSchema } from "../shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const scraper = new WebScraper();
  const schemaGenerator = new SchemaGenerator();

  app.get("/api/getData", (req, res) => {
    res.status(200).json({ data: "working" });
  });

  app.post("/api/scrape", async (req, res) => {
    try {
      // Validate request body
      const validationResult = scrapeRequestSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid request data: " +
            validationResult.error.errors.map((e) => e.message).join(", "),
        });
      }

      const { url, generateArticle, generateBreadcrumb, generateFaq } =
        validationResult.data;

      // Scrape the URL
      const extractedData = await scraper.scrapeUrl(url);

      // Generate schemas
      const schemas: any = {};

      if (generateArticle) {
        schemas.article = schemaGenerator.generateArticleSchema(
          extractedData,
          url
        );
      }

      if (generateBreadcrumb) {
        const breadcrumbSchema =
          schemaGenerator.generateBreadcrumbSchema(extractedData);
        if (breadcrumbSchema) {
          schemas.breadcrumb = breadcrumbSchema;
        }
      }

      if (generateFaq) {
        const faqSchema = schemaGenerator.generateFaqSchema(extractedData);
        if (faqSchema) {
          schemas.faq = faqSchema;
        }
      }

      const response = {
        success: true,
        data: {
          extractedData,
          schemas,
        },
      };

      res.json(response);
    } catch (error) {
      console.error("Scraping error:", error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An error occurred while scraping the URL",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
