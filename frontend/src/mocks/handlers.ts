import { http } from "msw";

const mockUsers = [
  { id: 1, name: "MSW Alice", email: "msw-alice@mock.com", role: "admin" },
  { id: 2, name: "MSW Bob", email: "msw-bob@mock.com", role: "member" },
  { id: 3, name: "MSW Carol", email: "msw-carol@mock.com", role: "member" },
];

export const handlers = [
  http.get("http://*/users", () => {
    console.log("[MSW] Intercepted GET /users");
    return new Response(JSON.stringify(mockUsers), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),

  // POST /users — simulate successful creation
  http.post("http://*/users", async ({ request }) => {
    console.log("[MSW] Intercepted POST /users");
    const body = (await request.json()) as {
      name: string;
      email: string;
      role: string;
    };
    const newUser = { id: mockUsers.length + 1, ...body };
    return new Response(JSON.stringify(newUser), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  }),
];
