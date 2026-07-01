import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { db } from "./db/database";

vi.mock("virtual:pwa-register", () => ({ registerSW: () => vi.fn() }));
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

describe("App", () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
  });

  afterEach(async () => {
    cleanup();
    await db.delete();
  });

  it("renders dashboard after seeding", async () => {
    render(<App />);
    expect(await screen.findByText("Dashboard")).toBeInTheDocument();
    expect(await screen.findByText(/Strength this week/i)).toBeInTheDocument();
  });

  it("shows schedule and completed workouts before opening the program editor", async () => {
    render(<App />);
    fireEvent.click(await screen.findByText("Lift"));
    expect(await screen.findByText("Month 1 schedule")).toBeInTheDocument();
    expect(await screen.findByText("Completed workouts")).toBeInTheDocument();
    expect(screen.getByText("Edit program")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Workout editor" })).not.toBeInTheDocument();
  });
});
