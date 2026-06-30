import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { db } from "./db/database";

vi.mock("virtual:pwa-register", () => ({ registerSW: () => vi.fn() }));
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

describe("App", () => {
  afterEach(async () => {
    await db.delete();
  });

  it("renders dashboard after seeding", async () => {
    render(<App />);
    expect(await screen.findByText("Dashboard")).toBeInTheDocument();
    expect(await screen.findByText(/Strength this week/i)).toBeInTheDocument();
  });
});
