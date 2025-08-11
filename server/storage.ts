// Storage interface for the Schema Generator application
// Currently, this application doesn't require database storage
// All operations are stateless and process URLs in real-time

export interface IStorage {
  // This interface is kept for future extensibility
  // if we need to store scraping history or user preferences
}

// No storage instance needed for this stateless application
