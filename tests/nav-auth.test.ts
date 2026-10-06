import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ isLoaded: true, isSignedIn: false }));
vi.mock("@clerk/nextjs", () => ({ useAuth: () => auth }));
vi.mock("../components/SignInButton", () => ({
  SignInButton: () => "Prijavi se",
}));
vi.mock("../components/UserMenu", () => ({ UserMenu: () => "Moj nalog" }));
vi.mock("../components/NotificationBell", () => ({
  NotificationBell: () => "Obaveštenja",
}));
import { NavAuthActions } from "../components/NavAuthActions";

describe("navigation follows the current Clerk session", () => {
  it("replaces the login action after sign-in and restores it after sign-out", () => {
    auth.isLoaded = true;
    auth.isSignedIn = false;
    expect(renderToStaticMarkup(createElement(NavAuthActions))).toContain(
      "Prijavi se",
    );
    auth.isSignedIn = true;
    const signedIn = renderToStaticMarkup(createElement(NavAuthActions));
    expect(signedIn).toContain("Moj nalog");
    expect(signedIn).toContain("Obaveštenja");
    expect(signedIn).not.toContain("Prijavi se");
    auth.isSignedIn = false;
    expect(renderToStaticMarkup(createElement(NavAuthActions))).toContain(
      "Prijavi se",
    );
  });

  it("does not offer sign-in while Clerk is still resolving the session", () => {
    auth.isLoaded = false;
    auth.isSignedIn = false;
    const loading = renderToStaticMarkup(createElement(NavAuthActions));
    expect(loading).toContain("Učitavanje naloga");
    expect(loading).not.toContain("Prijavi se");
  });
});
