import { cleanup } from "@testing-library/react";
import { composeStories } from "@storybook/react-vite";
import { afterEach, test } from "vitest";

type RunnableStory = {
  run: () => Promise<void>;
};

const storyModules = import.meta.glob("../components/**/*.stories.tsx", { eager: true });

afterEach(cleanup);

for (const [modulePath, storyModule] of Object.entries(storyModules)) {
  const stories = composeStories(
    storyModule as Parameters<typeof composeStories>[0]
  ) as unknown as Record<string, RunnableStory>;
  const contractStory = stories.CanonicalSchemaSerialization;

  if (contractStory) {
    test(`${modulePath} serializes canonical schema properties`, async () => {
      await contractStory.run();
    });
  }
}
