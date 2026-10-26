-- Commit this enum value before a later migration uses it in a column default.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ANNOTATOR';
