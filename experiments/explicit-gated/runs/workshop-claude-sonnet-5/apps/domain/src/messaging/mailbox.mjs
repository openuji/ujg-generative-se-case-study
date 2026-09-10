/**
 * A stand-in for sending mail.
 *
 * Nothing leaves the process. Each rendered message is kept in memory against
 * the participant it was addressed to, newest first, and the most recent few
 * can be read back — which is enough to see exactly what a participant would
 * have received without a mail service being involved at all.
 */

const defaultRetainedPerParticipant = 10;

export function createMailbox({ retainPerParticipant = defaultRetainedPerParticipant } = {}) {
  const delivered = new Map();

  return {
    /** Records one rendered message as delivered. Returns the stored record. */
    deliver({ participantId, to, subject, html, deliveredAt = new Date() }) {
      // The participant a message was for is the key it is filed under, not a
      // field of the message: a message reads the same as the one that was
      // sent, and only the participant it was for can ask for it back.
      const record = Object.freeze({
        to,
        subject,
        html,
        deliveredAt: deliveredAt.toISOString()
      });
      const existing = delivered.get(participantId) ?? [];
      delivered.set(participantId, [record, ...existing].slice(0, retainPerParticipant));
      return record;
    },

    /** Everything delivered to one participant, newest first. */
    read(participantId) {
      return [...(delivered.get(participantId) ?? [])];
    },

    /** Everything delivered, newest first per participant. */
    readAll() {
      return [...delivered.values()].flat();
    },

    clear() {
      delivered.clear();
    }
  };
}
