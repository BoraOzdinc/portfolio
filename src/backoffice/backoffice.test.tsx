import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { openDatabase } from "../../server/backoffice/database";
import { projectInput, resourceInput } from "../../shared/backoffice";
import {
  projects,
  resources,
  projectResources,
} from "../../server/backoffice/schema";
import { snapshot } from "../../server/backoffice/router";
import { createPlan } from "../../server/backoffice/billing";
import { ApiError } from "./api";
import Backoffice from "./backoffice";

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("./api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api")>()),
  api: mocks.api,
}));
vi.mock("better-auth/react", () => ({
  createAuthClient: () => ({
    signIn: { social: mocks.signIn },
    signOut: mocks.signOut,
  }),
}));
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
function fixture() {
  const store = openDatabase(":memory:");
  store.db
    .insert(projects)
    .values([
      { id: "melsa", ...projectInput.parse({ name: "MelsaShopp" }) },
      { id: "other", ...projectInput.parse({ name: "Diğer proje" }) },
    ])
    .run();
  store.db
    .insert(resources)
    .values({
      id: "vps",
      ...resourceInput.parse({
        name: "Paylaşılan VPS",
        type: "vps",
        ownerProjectId: "melsa",
        hostname: "server.example.com",
      }),
    })
    .run();
  store.db
    .insert(projectResources)
    .values({ resourceId: "vps", projectId: "other" })
    .run();
  createPlan(store.db, {
    name: "VPS",
    projectId: "melsa",
    resourceId: "vps",
    direction: "expense",
    amount: 120000,
    currency: "TRY",
    frequency: "yearly",
    firstDue: "2026-09-05",
  });
  return store;
}
function mount(path = "/backoffice") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Backoffice />
    </MemoryRouter>,
  );
}

describe("Backoffice operator flows", () => {
  it("renders a private sign-in screen when unauthenticated", async () => {
    mocks.api.mockRejectedValue(
      new ApiError(401, "Devam etmek için GitHub ile giriş yapın."),
    );
    mocks.signIn.mockResolvedValue({ data: {} });
    mount();
    await userEvent.click(
      await screen.findByRole("button", { name: "GitHub ile giriş yap" }),
    );
    expect(mocks.signIn).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "github" }),
    );
    expect(screen.queryByText("Hizmet envanteri")).toBeNull();
  });
  it("creates a project from the overview dialog", async () => {
    const store = fixture();
    try {
      mocks.api.mockImplementation(async (path: string) =>
        path.startsWith("/snapshot") ? snapshot(store.db) : { id: "new" },
      );
      mount();
      await screen.findByRole("heading", { name: "Çalışma masası" });
      await userEvent.click(
        screen.getAllByRole("button", { name: "Proje ekle" }).at(-1)!,
      );
      const dialog = screen.getByRole("dialog");
      await userEvent.type(
        within(dialog).getByLabelText("Proje adı"),
        "Yeni müşteri",
      );
      await userEvent.click(
        within(dialog).getByRole("button", { name: "Kaydet" }),
      );
      await waitFor(() =>
        expect(mocks.api).toHaveBeenCalledWith(
          "/projects",
          "POST",
          expect.objectContaining({ name: "Yeni müşteri" }),
        ),
      );
    } finally {
      store.sqlite.close();
    }
  });
  it("shows shared resource ownership without attributing its cost twice", async () => {
    const store = fixture();
    try {
      mocks.api.mockImplementation(async () =>
        snapshot(store.db, { projectId: "other" }),
      );
      mount("/backoffice?project=other&tab=resources");
      await screen.findByText("Ortak hizmet");
      expect(screen.getByText("Maliyet MelsaShopp projesinde.")).toBeTruthy();
      expect(screen.queryByRole("button", { name: "Ödeme planı" })).toBeNull();
    } finally {
      store.sqlite.close();
    }
  });
  it("saves mail addresses under a single package and converts plan amount to minor units", async () => {
    const store = fixture();
    try {
      mocks.api.mockImplementation(async (path: string) =>
        path.startsWith("/snapshot")
          ? snapshot(store.db, { projectId: "melsa" })
          : { id: "new" },
      );
      mount("/backoffice?project=melsa&tab=resources");
      await screen.findByText("Hizmet envanteri");
      await userEvent.click(
        screen.getAllByRole("button", { name: "Hizmet ekle" }).at(-1)!,
      );
      let dialog = screen.getByRole("dialog");
      await userEvent.type(
        within(dialog).getByLabelText("Hizmet adı"),
        "Mail paketi",
      );
      await userEvent.selectOptions(
        within(dialog).getByLabelText("Tür"),
        "email",
      );
      await userEvent.type(
        within(dialog).getByLabelText(
          "E-posta adresleri (her satıra bir adres)",
        ),
        "info@example.com\ndestek@example.com",
      );
      await userEvent.click(
        within(dialog).getByRole("button", { name: "Kaydet" }),
      );
      await waitFor(() =>
        expect(mocks.api).toHaveBeenCalledWith(
          "/resources",
          "POST",
          expect.objectContaining({
            addresses: ["info@example.com", "destek@example.com"],
            type: "email",
            ownerProjectId: "melsa",
          }),
        ),
      );
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      await userEvent.click(screen.getByRole("button", { name: "Finans" }));
      await userEvent.click(
        await screen.findByRole("button", { name: "Plan ekle" }),
      );
      dialog = screen.getByRole("dialog");
      await userEvent.type(
        within(dialog).getByLabelText("Açıklama"),
        "Bakım hizmeti",
      );
      await userEvent.selectOptions(
        within(dialog).getByLabelText("Hareket türü"),
        "income",
      );
      await userEvent.type(
        within(dialog).getByLabelText("Dönem tutarı"),
        "1250.50",
      );
      await userEvent.click(
        within(dialog).getByRole("button", { name: "Kaydet" }),
      );
      await waitFor(() =>
        expect(mocks.api).toHaveBeenCalledWith(
          "/plans",
          "POST",
          expect.objectContaining({
            direction: "income",
            amount: 125050,
            projectId: "melsa",
          }),
        ),
      );
    } finally {
      store.sqlite.close();
    }
  });
});
