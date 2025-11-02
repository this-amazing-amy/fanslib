/* eslint-disable functional/no-classes */
/* eslint-disable functional/no-this-expressions */
import type { BrowserContext, Page } from "playwright";
import { chromium } from "playwright";
import type {
  RedditPostDraft,
  RedditPosterConfig,
  RedditPostProgress,
  RedditPostResult,
} from "./types";

export class RedditPoster {
  private browser: BrowserContext | null = null;
  private page: Page | null = null;
  private config: RedditPosterConfig;
  private isRunning = false;

  constructor(config: RedditPosterConfig) {
    this.config = config;
  }

  private sendProgress = (stage: RedditPostProgress["stage"], message: string): void => {
    this.config.onProgress?.({ stage, message });
  };

  private initializeBrowser = async (): Promise<void> => {
    const sessionExists = await this.config.sessionStorage.exists();

    if (!sessionExists) {
      throw new Error("No Reddit session found. Please login first.");
    }

    const sessionPath = this.config.sessionStorage.getPath();
    this.browser = await chromium.launchPersistentContext(sessionPath, {
      headless: this.config.browserOptions?.headless ?? false,
      timeout: this.config.browserOptions?.timeout ?? 30000,
    });
    this.page = this.browser.pages()[0] ?? (await this.browser.newPage());

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
  };

  private navigateToSubmit = async (subreddit: string): Promise<void> => {
    if (!this.page) {
      throw new Error("Browser not initialized");
    }

    await this.page.goto(`https://www.reddit.com/r/${subreddit}/submit`);
    await this.page.waitForLoadState("networkidle");
  };

  private fillPostForm = async (draft: RedditPostDraft): Promise<void> => {
    if (!this.page) {
      throw new Error("Browser not initialized");
    }

    if (draft.type === "Link") {
      const linkTab = this.page.locator('[data-testid="post-type-link"]');
      await linkTab.click();

      if (draft.url) {
        const urlInput = this.page.locator('[name="url"]');
        await urlInput.fill(draft.url);
      }
    } else if (draft.type === "Text") {
      const textTab = this.page.locator('[data-testid="post-type-text"]');
      await textTab.click();
    }

    const titleInput = this.page.locator('[name="title"]');
    await titleInput.fill(draft.caption);

    if (draft.flair) {
      const flairButton = this.page.locator('[data-testid="flair-button"]');
      await flairButton.click();
      await this.page.waitForTimeout(500);

      const flairOption = this.page.locator(`[data-testid="flair-option"]:has-text("${draft.flair}")`);
      await flairOption.click();
    }
  };

  private submitPost = async (): Promise<string | undefined> => {
    if (!this.page) {
      throw new Error("Browser not initialized");
    }

    const submitButton = this.page.locator('[data-testid="post-submit-button"]');
    await submitButton.click();

    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(2000);

    const postUrl = this.page.url();

    if (postUrl.includes("/comments/")) {
      return postUrl;
    }

    return undefined;
  };

  postToReddit = async (draft: RedditPostDraft): Promise<RedditPostResult> => {
    if (this.isRunning) {
      return {
        success: false,
        error: "A post is already in progress",
      };
    }

    this.isRunning = true;

    this.sendProgress("initializing", "Initializing browser...");

    await this.initializeBrowser();

    this.sendProgress("loading", `Loading r/${draft.subreddit}...`);

    await this.navigateToSubmit(draft.subreddit);

    this.sendProgress("filling", "Filling post form...");

    await this.fillPostForm(draft);

    this.sendProgress("submitting", "Submitting post...");

    const url = await this.submitPost();

    if (!url) {
      this.isRunning = false;
      this.sendProgress("failed", "Failed to retrieve post URL");
      return {
        success: false,
        error: "Failed to retrieve post URL",
      };
    }

    this.sendProgress("verifying", "Verifying post...");

    await this.page?.waitForTimeout(1000);

    this.sendProgress("completed", `Post submitted successfully: ${url}`);

    this.isRunning = false;

    return {
      success: true,
      url,
    };
  };

  isCurrentlyRunning = (): boolean => {
    return this.isRunning;
  };

  dispose = async (): Promise<void> => {
    await this.browser?.close();
    this.browser = null;
    this.page = null;
    this.isRunning = false;
  };
}



