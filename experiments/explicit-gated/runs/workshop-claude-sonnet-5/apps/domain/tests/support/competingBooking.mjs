/**
 * One half of a genuinely competing booking.
 *
 * The thread opens its own connection to the same catalogue file, waits at a
 * barrier until its rival is ready, and then books. Both bookings therefore
 * reach the workshop at the same time, which is the only way to find out
 * whether the last place can be handed out twice.
 */

import { parentPort, workerData } from "node:worker_threads";

import { confirmRegistration } from "../../src/domain/registration.mjs";
import { openDatabase } from "../../src/persistence/database.mjs";

const { databaseFile, workshopId, participantId, submitted, barrier, competitors } = workerData;

const database = openDatabase(databaseFile);
const gate = new Int32Array(barrier);

// Everyone arrives, then everyone goes at once.
const arrived = Atomics.add(gate, 0, 1) + 1;
if (arrived >= competitors) {
  Atomics.notify(gate, 0);
} else {
  while (Atomics.load(gate, 0) < competitors) Atomics.wait(gate, 0, arrived, 5000);
}

try {
  const result = confirmRegistration({ database, workshopId, participantId, submitted });
  parentPort.postMessage({ participantId, outcome: result.outcome, effectApplied: result.effectApplied ?? false });
} catch (error) {
  parentPort.postMessage({ participantId, outcome: "threw", message: error.message });
} finally {
  database.close();
}
