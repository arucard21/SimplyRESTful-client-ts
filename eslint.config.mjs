import globals from "globals";
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	eslint.configs.recommended,
	tseslint.configs.recommended,
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},

			ecmaVersion: "latest",
			sourceType: "module",
		},
	},
	{
		ignores: ["dist/**", "coverage/**", "cypress/**"],
	}
);