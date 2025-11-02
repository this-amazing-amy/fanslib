/* eslint-disable functional/no-loop-statements */
/* eslint-disable functional/no-this-expressions */
/* eslint-disable functional/no-classes */
import type { BrowserContext, Page } from "playwright";
import { chromium } from "playwright";
import type {
  RedditLoginHandlerConfig,
  RedditLoginResult,
  RedditLoginStatus,
  RedditPostProgress,
} from "./types";

export class RedditLoginHandler {
  private browser: BrowserContext  | null = null;
  private page: Page | null = null;
  private config: RedditLoginHandlerConfig;

  constructor(config: RedditLoginHandlerConfig) {
    this.config = config;
  }

  private sendProgress = (stage: RedditPostProgress["stage"], message: string): void => {
    this.config.onProgress?.({ stage, message });
  };

  private initializeBrowser = async (): Promise<void> => {
    const sessionExists = await this.config.sessionStorage.exists();

    if (sessionExists) {
      const sessionPath = this.config.sessionStorage.getPath();
      this.browser = await chromium.launchPersistentContext(sessionPath, {
        headless: this.config.browserOptions?.headless ?? false,
        timeout: this.config.browserOptions?.timeout ?? 30000,
      });
      this.page = this.browser.pages()[0] ?? (await this.browser.newPage());
    } else {
      this.browser = await chromium.launch({
        headless: this.config.browserOptions?.headless ?? false,
        timeout: this.config.browserOptions?.timeout ?? 30000,
      })?.then((browser) => browser.contexts()[0] ?? null);
      this.page = (await this.browser?.newPage()) ?? null;
    }
  };

  private waitForLogin = async (): Promise<string | undefined> => {
    if (!this.page) {
      throw new Error("Browser not initialized");
    }

    const timeout = this.config.loginTimeout ?? 300000;
    const startTime = Date.now();

    await this.page.goto("https://www.reddit.com/login");

    while (Date.now() - startTime < timeout) {
      const currentUrl = this.page.url();

      if (!currentUrl.includes("reddit.com/login")) {
        const username = await this.extractUsername();
        return username;
      }

      await this.page.waitForTimeout(1000);
    }

    throw new Error("Login timeout");
  };

  private extractUsername = async (): Promise<string | undefined> => {
    if (!this.page) return undefined;

    await this.page.goto("https://www.reddit.com/settings");
    await this.page.waitForTimeout(2000);

    const username = await this.page.evaluate(() => {
      const usernameElement = document.querySelector('[data-testid="username"]');
      return usernameElement?.textContent ?? undefined;
    });

    return username;
  };

  private saveSession = async (): Promise<void> => {
    if (!this.page) return;

    const cookies = await this.page.context().cookies();
    const localStorage = await this.page.evaluate(() => JSON.stringify(window.localStorage));
    const sessionStorage = await this.page.evaluate(() => JSON.stringify(window.sessionStorage));

    const sessionData = {
      cookies,
      localStorage,
      sessionStorage,
    };

    await this.config.sessionStorage.write(JSON.stringify(sessionData));
  };

  performLogin = async (): Promise<RedditLoginResult> => {
    this.sendProgress("initializing", "Initializing browser...");

    await this.initializeBrowser();

    this.sendProgress("loading", "Waiting for login...");

    const username = await this.waitForLogin();

    if (!username) {
      return {
        success: false,
        error: "Failed to extract username after login",
      };
    }

    this.sendProgress("verifying", "Saving session...");

    await this.saveSession();

    this.sendProgress("completed", `Successfully logged in as u/${username}`);

    return {
      success: true,
      username,
    };
  };

  checkLoginStatus = async (): Promise<RedditLoginStatus> => {
    this.sendProgress("initializing", "Checking login status...");

    const sessionExists = await this.config.sessionStorage.exists();

    if (!sessionExists) {
      return {
        success: false,
        error: "No session found",
      };
    }

    await this.initializeBrowser();

    this.sendProgress("loading", "Verifying session...");

    if (!this.page) {
      return {
        success: false,
        error: "Failed to initialize browser",
      };
    }

    const sessionData = await this.config.sessionStorage.read();
    const { cookies, localStorage: localStorageData, sessionStorage: sessionStorageData } = JSON.parse(sessionData);

    await this.page.context().addCookies(cookies);

    await this.page.evaluate(
      ({ localStorage: localStorageData, sessionStorage: sessionStorageData }) => {
        Object.entries(JSON.parse(localStorageData)).forEach(([key, value]) => {
          window.localStorage.setItem(key, value as string);
        });

        Object.entries(JSON.parse(sessionStorageData)).forEach(([key, value]) => {
          window.sessionStorage.setItem(key, value as string);
        });
      },
      { localStorage: localStorageData, sessionStorage: sessionStorageData }
    );

    await this.page.goto("https://www.reddit.com");
    await this.page.waitForTimeout(2000);

    const isLoggedIn = await this.page.evaluate(() => {
      const usernameElement = document.querySelector('[data-testid="user-menu-trigger"]');
      return !!usernameElement;
    });

    if (!isLoggedIn) {
      return {
        success: false,
        error: "Session expired",
      };
    }

    const username = await this.extractUsername();

    return {
      success: true,
      username,
    };
  };

  dispose = async (): Promise<void> => {
    await this.browser?.close();
    this.browser = null;
    this.page = null;
  };
}



