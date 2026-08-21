# Frozen reference domain implementation

This directory is intentionally empty at repository initialization.

After the domain-generation experiment:

1. freeze a reviewed technology-neutral domain artifact;
2. implement one deterministic reference domain/service from it;
3. expose deterministic fixture/setup/reset controls for Journey Mesh;
4. keep this implementation fixed across frontend-generation runs.

The frontend experiment must not regenerate or mutate this domain implementation per model run.
