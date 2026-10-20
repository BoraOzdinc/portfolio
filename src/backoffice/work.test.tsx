import { afterEach, beforeAll, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { openDatabase } from "../../server/backoffice/database";
import { snapshot } from "../../server/backoffice/router";
import { workSnapshot } from "../../server/backoffice/work";
import { today } from "../../server/backoffice/dates";
import * as s from "../../server/backoffice/schema";
import Backoffice from "./backoffice";

const mocks = vi.hoisted(() => ({ api: vi.fn() }));
vi.mock("./api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api")>()),
  api: mocks.api,
}));
vi.mock("better-auth/react", () => ({
  createAuthClient: () => ({ signIn: { social: vi.fn() }, signOut: vi.fn() }),
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

it("logs office exit and remote work, totals the month and links the export", async () => {
  const store = openDatabase(":memory:");
  const day = today();
  store.db
    .insert(s.workSessions)
    .values({
      id: "w1",
      date: day,
      kind: "office",
      start: "18:00",
      end: "19:30",
      note: "Sürüm",
    })
    .run();
  try {
    mocks.api.mockImplementation(async (path: string, method?: string) => {
      if (path.startsWith("/snapshot")) return snapshot(store.db);
      if (path.startsWith("/work") && !method) return workSnapshot(store.db);
      return { id: "new" };
    });
    render(
      <MemoryRouter initialEntries={["/backoffice?view=work"]}>
        <Backoffice />
      </MemoryRouter>,
    );
    await screen.findByRole("heading", { name: "Mesai" });
    expect(screen.getAllByText("1 sa 30 dk").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: /Excel’e aktar/ }).getAttribute("href"),
    ).toBe(`/api/backoffice/work/export?month=${day.slice(0, 7)}`);

    fireEvent.change(screen.getByLabelText("Başlangıç"), {
      target: { value: "20:00" },
    });
    fireEvent.change(screen.getByLabelText("Bitiş"), {
      target: { value: "22:00" },
    });
    await userEvent.type(
      screen.getByLabelText("Açıklama / neden"),
      "Acil hata düzeltmesi",
    );
    await userEvent.click(screen.getByRole("button", { name: "Kaydet" }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith("/work", "POST", {
        date: day,
        kind: "remote",
        start: "20:00",
        end: "22:00",
        duration: null,
        note: "Acil hata düzeltmesi",
      }),
    );

    await userEvent.click(screen.getByRole("button", { name: "Sadece süre" }));
    await userEvent.type(screen.getByLabelText("Süre (saat)"), "1.5");
    await userEvent.type(
      screen.getByLabelText("Açıklama / neden"),
      "İzmir yolculuğu",
    );
    await userEvent.click(screen.getByRole("button", { name: "Kaydet" }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith("/work", "POST", {
        date: day,
        kind: "remote",
        start: null,
        end: null,
        duration: 90,
        note: "İzmir yolculuğu",
      }),
    );

    await userEvent.click(screen.getByLabelText(/kaydını seç$/));
    await userEvent.click(
      screen.getByRole("button", { name: "Ödendi işaretle" }),
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Bordro dönemi"), {
      target: { value: "2026-09" },
    });
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Kaydet" }),
    );
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith("/work/pay", "POST", {
        ids: ["w1"],
        paidPeriod: "2026-09",
      }),
    );

    await userEvent.click(screen.getByRole("button", { name: "Saat aralığı" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Ofisten çıkış" }),
    );
    expect(screen.getByLabelText("Planlanan çıkış")).toHaveProperty(
      "value",
      "18:00",
    );
  } finally {
    store.sqlite.close();
  }
});
