import { DomainError } from "./errors.mjs";
import {
  alreadyConfirmed,
  alreadyRegisteredDetail,
  alreadyWaitlistedDetail,
  confirmed,
  offerStatus,
  offerSummary,
  registrationClosed,
  waitlisted,
  workshopDetail,
  workshopTeaser
} from "./presenters.mjs";

const outcome = (name, data) => ({ outcome: name, data });

export class WorkshopService {
  constructor(store, { now = () => new Date() } = {}) {
    this.store = store;
    this.now = now;
  }

  listWorkshops() {
    return outcome("overview", {
      items: this.store.listWorkshops().map((workshop) => ({
        workshopId: workshop.id,
        data: workshopTeaser(workshop)
      }))
    });
  }

  getWorkshop(participant, workshopId) {
    const workshop = this.#requireWorkshop(workshopId);
    const existing = this.store.getParticipation(participant.id, workshopId);
    if (existing?.status === "confirmed") return outcome("alreadyRegistered", alreadyRegisteredDetail(workshop));
    if (existing?.status === "waitlisted") return outcome("alreadyWaitlisted", alreadyWaitlistedDetail(workshop));
    if (workshop.availability === "placeAvailable") return outcome("registrationOpen", workshopDetail(workshop));
    if (workshop.availability === "waitlistOpen") return outcome("waitlistOpen", workshopDetail(workshop));
    return outcome("registrationClosed", registrationClosed());
  }

  confirmRegistration(participant, workshopId, details) {
    return this.store.transaction(() => {
      const workshop = this.#requireWorkshop(workshopId);
      const existing = this.store.getParticipation(participant.id, workshopId);
      if (existing?.status === "confirmed") return outcome("alreadyConfirmed", alreadyConfirmed(workshop));
      if (workshop.availability === "placeAvailable") {
        this.store.saveParticipation({
          participantId: participant.id,
          workshopId,
          status: "confirmed",
          name: details.name,
          email: details.email,
          notes: details.accessibilityNotes,
          now: this.now().toISOString()
        });
        return outcome("confirmed", confirmed(workshop));
      }
      if (workshop.availability === "waitlistOpen") return outcome("waitlistOpen", workshopDetail(workshop));
      return outcome("registrationClosed", registrationClosed());
    });
  }

  joinWaitlist(participant, workshopId, details) {
    return this.store.transaction(() => {
      const workshop = this.#requireWorkshop(workshopId);
      const existing = this.store.getParticipation(participant.id, workshopId);
      if (existing?.status === "waitlisted") return outcome("alreadyWaitlisted", waitlisted(workshop, true));
      if (workshop.availability === "waitlistOpen") {
        this.store.saveParticipation({
          participantId: participant.id,
          workshopId,
          status: "waitlisted",
          name: details.name,
          email: details.email,
          notes: details.notes,
          now: this.now().toISOString()
        });
        return outcome("waitlisted", waitlisted(workshop));
      }
      if (workshop.availability === "registrationClosed") return outcome("registrationClosed", registrationClosed());
      throw new DomainError("Waitlist joining is not available for the workshop's current facts.");
    });
  }

  getOffer(participant, offerId) {
    return this.store.transaction(() => {
      const offer = this.#requireSubjectOffer(participant, offerId);
      const status = this.#effectiveOfferStatus(offer);
      const workshop = this.#requireWorkshop(offer.workshop_id);
      return status === "available"
        ? outcome("open", offerSummary(offer, workshop))
        : outcome(status, offerStatus(status, workshop));
    });
  }

  acceptOffer(participant, offerId) {
    return this.#resolveOffer(participant, offerId, "accepted");
  }

  declineOffer(participant, offerId) {
    return this.#resolveOffer(participant, offerId, "declined");
  }

  #resolveOffer(participant, offerId, resolution) {
    return this.store.transaction(() => {
      const offer = this.#requireSubjectOffer(participant, offerId);
      const status = this.#effectiveOfferStatus(offer);
      const workshop = this.#requireWorkshop(offer.workshop_id);

      if (status === resolution) return outcome(resolution, offerStatus(resolution, workshop));
      if (status === "expired" || status === "unavailable") return outcome(status, offerStatus(status, workshop));
      if (status !== "available") throw new DomainError(`The offered place was already ${status}.`);

      const participation = this.store.getParticipation(participant.id, offer.workshop_id);
      if (participation?.status !== "waitlisted") {
        throw new DomainError("The offered place has no continuous waitlisted participation.");
      }

      const timestamp = this.now().toISOString();
      if (resolution === "accepted") {
        this.store.saveParticipation({
          participantId: participant.id,
          workshopId: offer.workshop_id,
          status: "confirmed",
          name: participation.submitted_name,
          email: participation.submitted_email,
          notes: participation.notes,
          now: timestamp
        });
      }
      this.store.setOfferStatus(offer.id, resolution, timestamp);
      return outcome(resolution, offerStatus(resolution, workshop));
    });
  }

  #effectiveOfferStatus(offer) {
    if (offer.status === "available" && Date.parse(offer.expires_at) <= this.now().getTime()) {
      this.store.setOfferStatus(offer.id, "expired", this.now().toISOString());
      offer.status = "expired";
    }
    return offer.status;
  }

  #requireWorkshop(workshopId) {
    const workshop = this.store.getWorkshop(workshopId);
    if (!workshop) throw new DomainError("Workshop not found.", 404);
    return workshop;
  }

  #requireSubjectOffer(participant, offerId) {
    const offer = this.store.getOffer(offerId);
    if (!offer || offer.participant_id !== participant.id) {
      throw new DomainError("Offered place not found.", 404);
    }
    return offer;
  }
}
