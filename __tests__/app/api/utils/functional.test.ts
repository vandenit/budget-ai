import { expect, test } from "vitest";
import { pipeP, composeP } from "../../../../app/utils/functional";

test("pipeP executes async functions in sequence", async () => {
  const addOne = (x: number) => Promise.resolve(x + 1);
  const double = (x: number) => Promise.resolve(x * 2);
  const square = (x: number) => Promise.resolve(x * x);

  const result = await pipeP(addOne, double, square)(1);

  expect(result).toBe(16);
});

test("composeP executes async functions in reverse sequence", async () => {
  const addOne = (x: number) => Promise.resolve(x + 1);
  const double = (x: number) => Promise.resolve(x * 2);
  const square = (x: number) => Promise.resolve(x * x);

  const result = await composeP(addOne, double, square)(1);

  expect(result).toBe(3);
});
