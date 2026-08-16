import { describe, expect, it } from "vitest";
import { captainEmails, normalizeCaptainEmails } from "../src/lib/captain-emails";

describe("captain emails", () => {
  it("normalizes and de-duplicates a comma-separated captain list", () => {
    expect(captainEmails(" Captain@example.com, co-captain@example.com, captain@example.com ")).toEqual([
      "captain@example.com",
      "co-captain@example.com",
    ]);
    expect(normalizeCaptainEmails(" Captain@example.com,co-captain@example.com ")).toBe("captain@example.com, co-captain@example.com");
  });

  it("rejects a list containing an invalid email", () => {
    expect(() => captainEmails("captain@example.com, not-an-email")).toThrow("valid captain email");
  });
});
