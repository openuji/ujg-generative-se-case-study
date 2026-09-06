export class FakeAuthAdapter {
  constructor(store) {
    this.store = store;
  }

  authenticate(authorization) {
    const match = /^Bearer ([^ ]+)$/.exec(authorization ?? "");
    return match ? this.store.getParticipantByToken(match[1]) : undefined;
  }
}
