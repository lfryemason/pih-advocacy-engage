import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  UsersTableClient,
  type AdminUserRow,
} from "@/components/admin/users-table-client";

const ALL_TEAMS = [
  { name: "Alpha Team", slug: "alpha-team" },
  { name: "Beta Squad", slug: "beta-squad" },
];

function makeUser(overrides: Partial<AdminUserRow> = {}): AdminUserRow {
  return {
    user_id: "user-1",
    fullName: "Jane Doe",
    email: "jane@example.com",
    isAdmin: false,
    isPending: false,
    teams: [],
    ...overrides,
  };
}

function makeUsers(count: number): AdminUserRow[] {
  return Array.from({ length: count }, (_, index) => ({
    user_id: `user-${index + 1}`,
    fullName: `User ${String(index + 1).padStart(3, "0")}`,
    email: `user${index + 1}@example.com`,
    isAdmin: false,
    isPending: false,
    teams: [],
  }));
}

describe("UsersTableClient — rendering", () => {
  it("renders user names and emails", () => {
    render(
      <UsersTableClient
        users={[
          makeUser(),
          makeUser({
            user_id: "user-2",
            fullName: "Bob Smith",
            email: "bob@example.com",
          }),
        ]}
        allTeams={[]}
      />,
    );
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    expect(screen.getByText("Bob Smith")).toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
  });

  it("shows the admin shield icon for admin users but not for regular users", () => {
    render(
      <UsersTableClient
        users={[
          makeUser({ user_id: "u1", fullName: "Admin User", isAdmin: true }),
          makeUser({ user_id: "u2", fullName: "Regular User", isAdmin: false }),
        ]}
        allTeams={[]}
      />,
    );
    const adminCell = screen.getByText("Admin User").closest("td");
    const regularCell = screen.getByText("Regular User").closest("td");
    expect(adminCell?.querySelector("svg")).toBeInTheDocument();
    expect(regularCell?.querySelector("svg")).not.toBeInTheDocument();
  });

  it("renders team links for users with teams", () => {
    render(
      <UsersTableClient
        users={[
          makeUser({ teams: [{ name: "Alpha Team", slug: "alpha-team" }] }),
        ]}
        allTeams={ALL_TEAMS}
      />,
    );
    const link = screen.getByRole("link", { name: "Alpha Team" });
    expect(link).toHaveAttribute("href", "/teams/alpha-team");
  });

  it("renders multiple team links when a user is on several teams", () => {
    render(
      <UsersTableClient
        users={[
          makeUser({
            teams: [
              { name: "Alpha Team", slug: "alpha-team" },
              { name: "Beta Squad", slug: "beta-squad" },
            ],
          }),
        ]}
        allTeams={ALL_TEAMS}
      />,
    );
    expect(
      screen.getByRole("link", { name: "Alpha Team" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Beta Squad" }),
    ).toBeInTheDocument();
  });

  it("shows an em-dash for users with no teams", () => {
    render(<UsersTableClient users={[makeUser()]} allTeams={[]} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows the empty state row when no users match the current filter", async () => {
    render(<UsersTableClient users={[makeUser()]} allTeams={[]} />);
    await userEvent.type(screen.getByRole("searchbox"), "zzznomatch");
    expect(
      screen.getByText("No users match your filters."),
    ).toBeInTheDocument();
  });
});

describe("UsersTableClient — count text", () => {
  it('shows "0 users" when no users match the filter', async () => {
    render(<UsersTableClient users={[makeUser()]} allTeams={[]} />);
    await userEvent.type(screen.getByRole("searchbox"), "zzznomatch");
    expect(screen.getByText("0 users")).toBeInTheDocument();
  });

  it('shows singular "1 user" for exactly one result', () => {
    render(<UsersTableClient users={[makeUser()]} allTeams={[]} />);
    expect(screen.getByText("1–1 of 1 user")).toBeInTheDocument();
  });

  it('shows plural "N users" for multiple results', () => {
    render(
      <UsersTableClient
        users={[
          makeUser({ user_id: "u1", fullName: "Alice" }),
          makeUser({ user_id: "u2", fullName: "Bob" }),
        ]}
        allTeams={[]}
      />,
    );
    expect(screen.getByText("1–2 of 2 users")).toBeInTheDocument();
  });
});

describe("UsersTableClient — name search", () => {
  const users = [
    makeUser({
      user_id: "u1",
      fullName: "Alice Adams",
      email: "alice@example.com",
    }),
    makeUser({
      user_id: "u2",
      fullName: "Bob Brown",
      email: "bob@example.com",
    }),
  ];

  it("filters users by name substring (case-insensitive)", async () => {
    render(<UsersTableClient users={users} allTeams={[]} />);
    await userEvent.type(screen.getByRole("searchbox"), "alice");
    expect(screen.getByText("Alice Adams")).toBeInTheDocument();
    expect(screen.queryByText("Bob Brown")).not.toBeInTheDocument();
  });

  it("shows all users when the search is cleared", async () => {
    render(<UsersTableClient users={users} allTeams={[]} />);
    await userEvent.type(screen.getByRole("searchbox"), "alice");
    await userEvent.clear(screen.getByRole("searchbox"));
    expect(screen.getByText("Alice Adams")).toBeInTheDocument();
    expect(screen.getByText("Bob Brown")).toBeInTheDocument();
  });
});

describe("UsersTableClient — team filter", () => {
  const users = [
    makeUser({
      user_id: "u1",
      fullName: "Alice Adams",
      teams: [{ name: "Alpha Team", slug: "alpha-team" }],
    }),
    makeUser({
      user_id: "u2",
      fullName: "Bob Brown",
      teams: [{ name: "Beta Squad", slug: "beta-squad" }],
    }),
    makeUser({ user_id: "u3", fullName: "Carol Chen", teams: [] }),
  ];

  it("filters to users on a specific team", async () => {
    render(<UsersTableClient users={users} allTeams={ALL_TEAMS} />);
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(screen.getByRole("option", { name: "Alpha Team" }));
    expect(screen.getByText("Alice Adams")).toBeInTheDocument();
    expect(screen.queryByText("Bob Brown")).not.toBeInTheDocument();
    expect(screen.queryByText("Carol Chen")).not.toBeInTheDocument();
  });

  it('filters to users with no team when "No team" is selected', async () => {
    render(<UsersTableClient users={users} allTeams={ALL_TEAMS} />);
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(screen.getByRole("option", { name: "No team" }));
    expect(screen.queryByText("Alice Adams")).not.toBeInTheDocument();
    expect(screen.queryByText("Bob Brown")).not.toBeInTheDocument();
    expect(screen.getByText("Carol Chen")).toBeInTheDocument();
  });

  it('shows all users when the filter is cleared to "All teams"', async () => {
    render(<UsersTableClient users={users} allTeams={ALL_TEAMS} />);
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(screen.getByRole("option", { name: "Alpha Team" }));
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(screen.getByRole("option", { name: "All teams" }));
    expect(screen.getByText("Alice Adams")).toBeInTheDocument();
    expect(screen.getByText("Bob Brown")).toBeInTheDocument();
    expect(screen.getByText("Carol Chen")).toBeInTheDocument();
  });
});

describe("UsersTableClient — pagination", () => {
  it("does not show pagination controls for 25 or fewer users", () => {
    render(<UsersTableClient users={makeUsers(25)} allTeams={[]} />);
    expect(
      screen.queryByRole("button", { name: "Next" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Previous" }),
    ).not.toBeInTheDocument();
  });

  it("shows pagination controls when there are more than 25 users", () => {
    render(<UsersTableClient users={makeUsers(26)} allTeams={[]} />);
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Previous" }),
    ).toBeInTheDocument();
  });

  it("shows the first-page range and disables Previous on page 1", () => {
    render(<UsersTableClient users={makeUsers(26)} allTeams={[]} />);
    expect(screen.getByText("1–25 of 26 users")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled();
  });

  it("advances to page 2 and disables Next on the last page", async () => {
    render(<UsersTableClient users={makeUsers(26)} allTeams={[]} />);
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("26–26 of 26 users")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous" })).not.toBeDisabled();
  });

  it("returns to page 1 when Previous is clicked from page 2", async () => {
    render(<UsersTableClient users={makeUsers(26)} allTeams={[]} />);
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByText("1–25 of 26 users")).toBeInTheDocument();
  });

  it("resets to page 1 when the name search changes", async () => {
    render(<UsersTableClient users={makeUsers(26)} allTeams={[]} />);
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("26–26 of 26 users")).toBeInTheDocument();
    await userEvent.type(screen.getByRole("searchbox"), "001");
    expect(screen.getByText("1–1 of 1 user")).toBeInTheDocument();
  });

  it("resets to page 1 when the team filter changes", async () => {
    const users = [
      ...makeUsers(25),
      makeUser({
        user_id: "user-26",
        fullName: "Zara Zoom",
        email: "zara@example.com",
        teams: [{ name: "Alpha Team", slug: "alpha-team" }],
      }),
    ];
    render(<UsersTableClient users={users} allTeams={ALL_TEAMS} />);
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Zara Zoom")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(screen.getByRole("option", { name: "Alpha Team" }));
    expect(screen.getByText("1–1 of 1 user")).toBeInTheDocument();
    expect(screen.getByText("Zara Zoom")).toBeInTheDocument();
  });
});
