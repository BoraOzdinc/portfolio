import { afterEach, beforeAll, expect, it, vi } from "vitest";
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
import { snapshot } from "../../server/backoffice/router";
import { budgetSnapshot } from "../../server/backoffice/budget";
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

it("shows the ledger, switches card scenarios and saves amounts as kuruş", async () => {
  const store = openDatabase(":memory:");
  const month = today().slice(0, 7);
  store.db
    .insert(s.accounts)
    .values({
      id: "a",
      name: "Vadesiz",
      balance: 4_000_000,
      updatedAt: new Date().toISOString(),
    })
    .run();
  store.db
    .insert(s.cards)
    .values({
      id: "c",
      name: "Bonus",
      bank: "",
      creditLimit: 5_000_000,
      dueDay: 28,
    })
    .run();
  store.db
    .insert(s.cardStatements)
    .values({
      id: "st",
      cardId: "c",
      period: month,
      dueOn: `${month}-28`,
      balance: 1_000_000,
      minimum: 200_000,
    })
    .run();
  try {
    mocks.api.mockImplementation(async (path: string, method?: string) => {
      if (path.startsWith("/snapshot")) return snapshot(store.db);
      if (path.startsWith("/budget") && !method)
        return budgetSnapshot(store.db);
      return { id: "new" };
    });
    render(
      <MemoryRouter initialEntries={["/backoffice?view=budget"]}>
        <Backoffice />
      </MemoryRouter>,
    );
    await screen.findByRole("heading", { name: "Bütçe" });
    const current = screen.getByText("Bu ay").closest("tr")!;
    // 40.000 TL − 2.000 TL minimum still to pay
    expect(within(current).getByText(/38\.000,00/)).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Tam borç" }));
    expect(within(current).getByText(/30\.000,00/)).toBeTruthy();

    await userEvent.click(
      screen.getByRole("button", { name: "Kredi kartları" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Ödeme gir" }));
    const dialog = screen.getByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Tamamı" }),
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Kaydet" }),
    );
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        "/budget/statements/st/pay",
        "POST",
        {
          paidAmount: 1_000_000,
        },
      ),
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Gelir ve giderler" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Kalem ekle" }));
    const item = screen.getByRole("dialog");
    await userEvent.type(within(item).getByLabelText("Ad"), "Maaş");
    await userEvent.selectOptions(within(item).getByLabelText("Tür"), "income");
    await userEvent.type(within(item).getByLabelText("Tutar (TL)"), "85000.5");
    await userEvent.click(within(item).getByRole("button", { name: "Kaydet" }));
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        "/budget/items",
        "POST",
        expect.objectContaining({
          name: "Maaş",
          direction: "income",
          amount: 8_500_050,
          frequency: "monthly",
        }),
      ),
    );
  } finally {
    store.sqlite.close();
  }
});

it("records an item's actual amount from the month detail", async () => {
  const store = openDatabase(":memory:");
  const month = today().slice(0, 7);
  store.db
    .insert(s.budgetItems)
    .values({
      id: "rent",
      name: "Kira",
      direction: "expense",
      amount: 2_750_000,
      frequency: "monthly",
      startOn: `${month}-01`,
    })
    .run();
  try {
    mocks.api.mockImplementation(async (path: string, method?: string) => {
      if (path.startsWith("/snapshot")) return snapshot(store.db);
      if (path.startsWith("/budget") && !method)
        return budgetSnapshot(store.db);
      return { id: "new" };
    });
    render(
      <MemoryRouter initialEntries={["/backoffice?view=budget"]}>
        <Backoffice />
      </MemoryRouter>,
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Gerçekleşti" }),
    );
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByLabelText("Açıklama")).toHaveProperty(
      "value",
      "Kira",
    );
    const amount = within(dialog).getByLabelText("Gerçek tutar (TL)");
    await userEvent.clear(amount);
    await userEvent.type(amount, "28000");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Kaydet" }),
    );
    await waitFor(() =>
      expect(mocks.api).toHaveBeenCalledWith(
        "/budget/transactions",
        "POST",
        expect.objectContaining({
          itemId: "rent",
          direction: "expense",
          amount: 2_800_000,
          date: `${month}-01`,
        }),
      ),
    );
  } finally {
    store.sqlite.close();
  }
});
