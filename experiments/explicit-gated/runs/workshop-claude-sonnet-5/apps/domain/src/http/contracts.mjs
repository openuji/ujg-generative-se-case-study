/**
 * The vocabulary the service's routes are described with.
 *
 * A route's request and response shapes are written once, here and in the
 * route table, and are used twice: to check what arrives on the wire and to
 * describe what the service accepts and returns. The product's authored data
 * contracts are referenced rather than restated.
 */

/** A reference to one of the product's authored data contracts. */
export function contract(name) {
  return { $ref: `#/components/schemas/${name}` };
}

export function object(properties, required = []) {
  return { type: "object", required, properties, additionalProperties: false };
}

export function arrayOf(items) {
  return { type: "array", items };
}

export function text(description) {
  return description === undefined ? { type: "string" } : { type: "string", description };
}

export function oneOf(...values) {
  return { type: "string", enum: values };
}

/** The shape every refused request answers with. */
export const problemSchema = object(
  {
    error: text("What went wrong, in one line."),
    problems: arrayOf(
      object({ pointer: text("Where in the submitted body."), message: text() }, ["pointer", "message"])
    )
  },
  ["error"]
);

export function problem(error, problems) {
  return problems === undefined ? { error } : { error, problems };
}
