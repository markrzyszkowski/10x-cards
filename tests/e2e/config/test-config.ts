/**
 * E2E Test Configuration
 *
 * Centralized configuration for E2E tests
 * Load values from environment variables with fallbacks
 */

export const TestConfig = {
  /**
   * Test user credentials
   */
  auth: {
    email: process.env.E2E_TEST_EMAIL || "test@example.com",
    password: process.env.E2E_TEST_PASSWORD || "testpassword123",
  },

  /**
   * Application URLs
   */
  urls: {
    base: process.env.BASE_URL || "http://localhost:4321",
    login: "/login",
    generate: "/generate",
    flashcards: "/flashcards",
  },

  /**
   * Timeouts (in milliseconds)
   */
  timeouts: {
    short: 5000, // 5 seconds
    medium: 10000, // 10 seconds
    long: 30000, // 30 seconds
    apiCall: 15000, // 15 seconds for API responses
  },

  /**
   * Flashcard generation constraints
   */
  generation: {
    minChars: 1000,
    maxChars: 10000,
    minProposals: 3,
    maxProposals: 10,
  },

  /**
   * Sample educational text for testing
   * Meets minimum character requirement
   */
  sampleText: {
    photosynthesis: `
      Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to create oxygen and energy in the form of sugar.
      During photosynthesis, plants take in carbon dioxide (CO2) and water (H2O) from the air and soil. Within the plant cell, the water is oxidized, meaning it loses electrons, while the carbon dioxide is reduced, meaning it gains electrons. This transforms the water into oxygen and the carbon dioxide into glucose. The plant then releases the oxygen back into the air and stores energy within the glucose molecules.
      Chlorophyll is the green pigment in plants that captures light energy from the sun. This pigment is found in chloroplasts, which are organelles within plant cells. The light energy absorbed by chlorophyll is used to combine carbon dioxide and water into glucose, a simple sugar that serves as food for the plant.
      The process of photosynthesis occurs in two main stages: the light-dependent reactions and the light-independent reactions (also known as the Calvin cycle). The light-dependent reactions take place in the thylakoid membranes of the chloroplasts and require direct light energy. During these reactions, light energy is converted into chemical energy in the form of ATP and NADPH. The light-independent reactions occur in the stroma of the chloroplasts and do not require light directly. Instead, they use the ATP and NADPH produced in the light-dependent reactions to convert carbon dioxide into glucose.
    `.repeat(2),

    cellBiology: `
      Cells are the basic building blocks of all living things. The human body is composed of trillions of cells. They provide structure for the body, take in nutrients from food, convert those nutrients into energy, and carry out specialized functions. Cells also contain the body's hereditary material and can make copies of themselves.
      Cells have many parts, each with a different function. Some of these parts, called organelles, are specialized structures that perform certain tasks within the cell. Eukaryotic cells, which include animal and plant cells, have a nucleus and other organelles surrounded by a plasma membrane. The nucleus contains the cell's chromosomes, which carry genetic information encoded in DNA. The cytoplasm is the gel-like substance within the cell that holds all the organelles.
      Mitochondria are known as the powerhouses of the cell because they generate most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy. The endoplasmic reticulum is a network of membranes involved in protein and lipid synthesis. The Golgi apparatus modifies, sorts, and packages proteins and lipids for storage or transport out of the cell.
    `.repeat(3),
  },
} as const;

/**
 * Helper to get full URL
 */
export function getFullUrl(path: string): string {
  return `${TestConfig.urls.base}${path}`;
}

/**
 * Helper to validate text length for generation
 */
export function isValidGenerationText(text: string): boolean {
  const length = text.length;
  return length >= TestConfig.generation.minChars && length <= TestConfig.generation.maxChars;
}
