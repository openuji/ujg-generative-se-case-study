export function normalizeForwardedArgs(args) {
  return args[0] === "--" ? args.slice(1) : args;
}
