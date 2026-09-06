# Reference frontend

This directory is the target for the generated reference frontend selected by
`ujg-implementation.yaml`.

The realization workflow generates it from the canonical UJG, its external data
schemas, the selected design-system implementation, and the generated OpenAPI
contract. Generated application files are disposable and must not acquire
manually maintained journey behavior.

The concrete runtime, framework, and build system are realization choices in
the root manifest, not UJG semantics.
