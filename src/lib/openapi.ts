export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Petwise API",
    version: "0.1.0",
    description:
      "Pet food and pet photo scan. Send multipart form-data. Authorize with header x-api-key.",
  },
  servers: [{ url: "/", description: "Current host" }],
  tags: [
    { name: "Scan", description: "Image analysis" },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
      },
    },
    schemas: {
      ErrorBody: {
        type: "object",
        properties: {
          message: { type: "string" },
          statusCode: { type: "integer" },
          success: { type: "boolean", example: false },
          errors: {},
        },
      },
      ScanSuccess: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["food", "pet"] },
              analysis: { type: "object", additionalProperties: true },
            },
          },
          message: { type: "string", example: "Scan complete." },
          statusCode: { type: "integer", example: 200 },
          success: { type: "boolean", example: true },
        },
      },
    },
  },
  security: [{ ApiKeyAuth: [] }],
  paths: {
    "/api/v1/scan/food": {
      post: {
        tags: ["Scan"],
        summary: "Scan pet food image",
        description:
          "Analyze a pet-food photo for the given pet. If the photo is a pet, returns pet analysis instead. Unsupported images return 400.",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["image"],
                properties: {
                  image: {
                    type: "string",
                    format: "binary",
                    description: "Food / packet photo (jpg, png, webp, max 10MB)",
                  },
                  outputLanguage: {
                    type: "string",
                    description: "Response language. Default English.",
                  },
                  petName: { type: "string", description: "Pet name from the app" },
                  species: {
                    type: "string",
                    enum: ["dog", "cat", "other", "unknown"],
                  },
                  allergies: {
                    type: "string",
                    description: "Ingredients the pet cannot eat",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Scan complete", content: { "application/json": { schema: { $ref: "#/components/schemas/ScanSuccess" } } } },
          "202": { description: "Queued. Poll GET /api/v1/scan/jobs/{jobId}" },
          "400": { description: "Validation failed or unsupported image", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorBody" } } } },
          "401": { description: "Missing or invalid x-api-key" },
          "405": { description: "Method not allowed" },
          "429": { description: "Too many requests (per IP or global)" },
          "502": { description: "Groq / scan failed" },
          "503": { description: "Queue full (100 jobs)" },
        },
      },
    },
    "/api/v1/scan/pet": {
      post: {
        tags: ["Scan"],
        summary: "Scan pet photo",
        description:
          "Analyze a pet photo for visible wellness. If the photo is pet food, returns food analysis instead.",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["image"],
                properties: {
                  image: {
                    type: "string",
                    format: "binary",
                    description: "Pet photo (jpg, png, webp, max 10MB)",
                  },
                  outputLanguage: {
                    type: "string",
                    description: "Response language. Default English.",
                  },
                  petName: {
                    type: "string",
                    description:
                      "Optional. Used if this photo is actually pet food.",
                  },
                  species: {
                    type: "string",
                    enum: ["dog", "cat", "other", "unknown"],
                  },
                  allergies: {
                    type: "string",
                    description:
                      "Optional. Used if this photo is actually pet food.",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Scan complete", content: { "application/json": { schema: { $ref: "#/components/schemas/ScanSuccess" } } } },
          "202": { description: "Queued. Poll GET /api/v1/scan/jobs/{jobId}" },
          "400": { description: "Validation failed or unsupported image", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorBody" } } } },
          "401": { description: "Missing or invalid x-api-key" },
          "405": { description: "Method not allowed" },
          "429": { description: "Too many requests (per IP or global)" },
          "502": { description: "Groq / scan failed" },
          "503": { description: "Queue full (100 jobs)" },
        },
      },
    },
    "/api/v1/scan/jobs/{id}": {
      get: {
        tags: ["Scan"],
        summary: "Get queued scan job",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Scan complete" },
          "202": { description: "Still queued or running" },
          "400": { description: "Unsupported image" },
          "401": { description: "Missing or invalid x-api-key" },
          "404": { description: "Job not found" },
          "502": { description: "Scan failed" },
        },
      },
    },
  },
} as const;
