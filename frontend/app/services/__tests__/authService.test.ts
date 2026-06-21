import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { validateEmail, validatePassword } from "~/services/authService";

describe("validateEmail", () => {
  it("returns error for empty string", () => {
    expect(validateEmail("")).toBe("Enter a valid email address.");
  });

  it("returns error for missing @", () => {
    expect(validateEmail("notanemail")).toBe("Enter a valid email address.");
  });

  it("returns error for missing domain", () => {
    expect(validateEmail("user@")).toBe("Enter a valid email address.");
  });

  it("returns error for missing tld", () => {
    expect(validateEmail("user@domain")).toBe("Enter a valid email address.");
  });

  it("returns empty string for valid email", () => {
    expect(validateEmail("user@domain.com")).toBe("");
  });

  it("returns empty string for email with subdomain", () => {
    expect(validateEmail("user@sub.domain.com")).toBe("");
  });

  it("returns empty string for email with plus prefix", () => {
    expect(validateEmail("user+tag@domain.com")).toBe("");
  });
});

describe("validatePassword", () => {
  it("returns error for empty string", () => {
    expect(validatePassword("")).toBe("Password must be at least 8 characters.");
  });

  it("returns error for too short password (7 chars)", () => {
    expect(validatePassword("abc1234")).toBe("Password must be at least 8 characters.");
  });

  it("returns empty string for exactly 8 characters", () => {
    expect(validatePassword("abcdef12")).toBe("");
  });

  it("returns empty string for a long password", () => {
    expect(validatePassword("this is a very secure password with spaces 123!")).toBe("");
  });
});
