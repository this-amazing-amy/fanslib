import tsParser from "@typescript-eslint/parser";
import functional from "eslint-plugin-functional";
import oxlint from "eslint-plugin-oxlint";
import preferArrowFunctions from "eslint-plugin-prefer-arrow-functions";

export default [
  {
    ignores: ["**/*.gen.ts"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "module",
    },
    plugins: {
      functional,
      "prefer-arrow-functions": preferArrowFunctions,
    },
    rules: {
      "functional/no-loop-statements": "error",
      "functional/no-classes": [
        "error",
        {
          ignoreCodePattern: [
            "extends Data.TaggedError",
            "extends Context.Tag",
            "extends Effect.Service",
          ],
        },
      ],
      "functional/no-this-expressions": "error",
      "functional/no-let": "error",
      "prefer-arrow-functions/prefer-arrow-functions": [
        "error",
        {
          allowedNames: [],
          allowNamedFunctions: false,
          allowObjectProperties: false,
          classPropertiesAllowed: false,
          disallowPrototype: false,
          returnStyle: "implicit",
          singleReturnOnly: false,
        },
      ],
    },
  },
  {
    // TypeORM entities are an exception to no-classes rule
    files: ["**/entity.ts", "**/entities.ts"],
    rules: {
      "functional/no-classes": "off",
      "functional/no-this-expressions": "off",
    },
  },
  ...oxlint.configs["flat/recommended"],
];
