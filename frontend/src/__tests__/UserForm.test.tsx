import React from "react";
import {
  render,
  screen,
  userEvent,
  waitFor,
} from "@testing-library/react-native";
import { http } from "msw";
import { server } from "../mocks/server.node";
import App from "../../App";

jest.mock("../../config", () => ({
  serverIp: "localhost",
  serverPort: "3000",
  serverUrl: "http://localhost:3000",
}));

describe("Phase 4 — Real-World MSW Patterns", () => {
  const user = userEvent.setup();

  it("adds a new user via POST and displays them in the list", async () => {
    await render(<App />);
    await user.type(screen.getByTestId("input-name"), "Dave New");
    await user.type(screen.getByTestId("input-email"), "dave@example.com");
    await user.press(screen.getByTestId("btn-add"));
    expect(screen.getByText("Dave New")).toBeTruthy();
  });

  it("sends the correct payload in the POST request", async () => {
    let capturedBody: any = null;
    server.use(
      http.post("http://*/users", async ({ request }) => {
        capturedBody = await request.json();
        return new Response(JSON.stringify({ id: 99, ...capturedBody }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }),
    );
    await render(<App />);
    await user.type(screen.getByTestId("input-name"), "Eve Test");
    await user.type(screen.getByTestId("input-email"), "eve@example.com");
    await user.press(screen.getByTestId("btn-add"));
    expect(capturedBody).toEqual({
      name: "Eve Test",
      email: "eve@example.com",
      role: "member",
    });
  });

  it("shows an error when POST returns 500", async () => {
    server.use(
      http.post("http://*/users", () => new Response(null, { status: 500 })),
    );
    await render(<App />);
    await user.type(screen.getByTestId("input-name"), "Frank Fail");
    await user.type(screen.getByTestId("input-email"), "frank@example.com");
    await user.press(screen.getByTestId("btn-add"));
    expect(screen.getByText("Failed to add user")).toBeTruthy();
  });

  it("shows an error when the API returns 401", async () => {
    server.use(
      http.get(
        "http://*/users",
        () =>
          new Response(JSON.stringify({ message: "Unauthorized" }), {
            status: 401,
          }),
      ),
    );
    await render(<App />);
    expect(screen.getByText("Failed to fetch users")).toBeTruthy();
  });

  it("shows an error when there is a network failure", async () => {
    server.use(
      http.get("http://*/users", () => {
        throw new TypeError("Network request failed");
      }),
    );
    await render(<App />);
    expect(screen.getByText("Failed to fetch users")).toBeTruthy();
  });
});
