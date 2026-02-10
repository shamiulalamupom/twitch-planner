import type { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { env } from "./lib/env";

export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Twitch Planner API",
    version: "1.0.0",
  },
  servers: [{ url: `http://localhost:${env.PORT}` }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              message: { type: "string" },
              details: {},
            },
          },
        },
      },
      SignupRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          token: { type: "string" },
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              email: { type: "string" },
              twitchUrl: { type: "string", nullable: true },
              logoUrl: { type: "string", nullable: true },
              createdAt: { type: "string" },
            },
          },
        },
      },
      UpdateMeRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          twitchUrl: { type: "string", nullable: true },
          logoUrl: { type: "string", nullable: true },
        },
      },
      CreatePlanningRequest: {
        type: "object",
        required: ["name", "weekStart", "weekEnd"],
        properties: {
          name: { type: "string" },
          weekStart: { type: "string", example: "2026-02-09" },
          weekEnd: { type: "string", example: "2026-02-15" },
        },
      },
      UpdatePlanningRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          weekStart: { type: "string" },
          weekEnd: { type: "string" },
          bgColor: { type: "string", nullable: true },
          textColor: { type: "string", nullable: true },
          accentColor: { type: "string", nullable: true },
        },
      },
      CreateEventRequest: {
        type: "object",
        required: ["gameName", "startsAt", "endsAt"],
        properties: {
          title: { type: "string", nullable: true },
          gameName: { type: "string" },
          gameImageUrl: { type: "string", nullable: true },
          startsAt: { type: "string", format: "date-time" },
          endsAt: { type: "string", format: "date-time" },
        },
      },
      UpdateEventRequest: {
        type: "object",
        properties: {
          title: { type: "string", nullable: true },
          gameName: { type: "string" },
          gameImageUrl: { type: "string", nullable: true },
          startsAt: { type: "string", format: "date-time" },
          endsAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        responses: { "200": { description: "OK" } },
      },
    },

    "/auth/signup": {
      post: {
        summary: "Create account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SignupRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "409": {
            description: "Email already used",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },

    "/auth/login": {
      post: {
        summary: "Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "401": {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },

    "/me": {
      get: {
        summary: "Get current user",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "OK" },
          "401": { description: "Unauthorized" },
        },
      },
      put: {
        summary: "Update current user",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateMeRequest" },
            },
          },
        },
        responses: {
          "200": { description: "OK" },
          "401": { description: "Unauthorized" },
        },
      },
    },

    "/plannings": {
      get: {
        summary: "List plannings (current user)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "OK" },
          "401": { description: "Unauthorized" },
        },
      },
      post: {
        summary: "Create planning",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreatePlanningRequest" },
            },
          },
        },
        responses: {
          "201": { description: "Created" },
          "401": { description: "Unauthorized" },
        },
      },
    },

    "/plannings/{id}": {
      get: {
        summary: "Get planning (includes events)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "OK" },
          "404": { description: "Not found" },
          "401": { description: "Unauthorized" },
        },
      },
      put: {
        summary: "Update planning",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdatePlanningRequest" },
            },
          },
        },
        responses: {
          "200": { description: "OK" },
          "404": { description: "Not found" },
          "401": { description: "Unauthorized" },
        },
      },
      delete: {
        summary: "Delete planning",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "204": { description: "No content" },
          "404": { description: "Not found" },
          "401": { description: "Unauthorized" },
        },
      },
    },

    "/plannings/{planningId}/events": {
      post: {
        summary: "Create event for planning",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "planningId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateEventRequest" },
            },
          },
        },
        responses: {
          "201": { description: "Created" },
          "404": { description: "Not found" },
          "401": { description: "Unauthorized" },
        },
      },
    },

    "/events/{eventId}": {
      put: {
        summary: "Update event",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "eventId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateEventRequest" },
            },
          },
        },
        responses: {
          "200": { description: "OK" },
          "404": { description: "Not found" },
          "401": { description: "Unauthorized" },
        },
      },
      delete: {
        summary: "Delete event",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "eventId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "204": { description: "No content" },
          "404": { description: "Not found" },
          "401": { description: "Unauthorized" },
        },
      },
    },
  },
} as const;

export function setupSwagger(app: Express) {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));
  app.get("/docs.json", (_req, res) => res.json(openapiSpec));
}
