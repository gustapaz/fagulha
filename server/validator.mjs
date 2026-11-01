import validate from "./generated-validator.mjs";
import { fail } from "./errors.mjs";
export function validateInput(input) {
  if (!validate(input))
    fail("invalid_input", "Confira tipos, limites e campos dos par�metros.");
  return input;
}
