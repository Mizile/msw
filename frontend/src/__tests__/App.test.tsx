import React from "react";
import { render, waitFor, screen } from "@testing-library/react-native";
import { http } from "msw";
import { server } from "../mocks/server.node";
import App from "../../App";

jest.mock("../../config", () => ({
  serverIp: "localhost",
  serverPort: "3000",
  serverUrl: "http://localhost:3000",
}));

describe("App — User Directory", () => {
  it("renders the list of users returned by the API", async () => {
    await render(<App />);
    expect(screen.getByText("MSW Alice")).toBeTruthy();
    expect(screen.getByText("MSW Bob")).toBeTruthy();
    expect(screen.getByText("MSW Carol")).toBeTruthy();
  });

  it("shows a loading indicator while fetching", async () => {
    server.use(http.get("http://*/users", () => new Promise(() => {})));
    await render(<App />);
    expect(screen.getByTestId("loading-indicator")).toBeTruthy();
  });

  it("shows an error message when the API fails", async () => {
    server.use(
      http.get("http://*/users", () => new Response(null, { status: 500 })),
    );
    await render(<App />);
    expect(screen.getByText("Failed to fetch users")).toBeTruthy();
  });
});
