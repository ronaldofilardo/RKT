import { z } from "zod";

// Accept CUID, UUID, or prefixed UUID formats for ID fields
// Accept CUID, UUID, prefixed UUID, or seed/test ID formats for ID fields
// CUID: 24-25 chars, no hyphens (e.g., cjs5nqpr7000001l29u6qr9f1)
// UUID: 36 chars, 5 segments 8-4-4-4-12, hex only (e.g., 550e8400-e29b-41d4-a716-446655440000)
// Prefixed UUID: 5 segments where first segment is an alphanumeric prefix
// followed by standard UUID body segments 4-4-4-12
// (e.g., pa2da1636-d6c4-4184-8fca-8dd8d5d8f3f9 or pac07fc77-ffd3-466e-af56-0ffc079d158a)
// Seed / Test IDs: e.g. seed_player_alcaraz, seed_player_sinner
export const flexibleIdValidator = z
  .string()
  .min(1, "ID cannot be empty")
  .max(128, "ID too long")
  .refine(
    (id) => /^[a-zA-Z0-9_-]{1,128}$/.test(id),
    "Must be a valid identifier containing only alphanumeric characters, underscores or hyphens",
  );
