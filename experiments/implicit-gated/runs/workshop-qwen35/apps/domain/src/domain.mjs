// UJG Workshop Registration Domain Engine
// This implements the authoritative logic for the workshop domain model

// Domain entities and their properties
const domainEntities = {
  workshop: {
    label: "Workshop",
    description: "Participant-facing workshop whose registration availability contributes to detail entry and confirmation outcomes.",
    properties: {
      registrationAvailability: {
        label: "Registration availability",
        description: "Current participant-facing registration availability for the workshop.",
        valueType: "string",
        allowedValues: ["placeAvailable", "waitlistOpen", "registrationClosed"]
      }
    }
  },
  participant: {
    label: "Participant",
    description: "The domain subject whose registration, waitlist, and offered-place outcomes are evaluated."
  },
  workshopParticipation: {
    label: "Workshop participation",
    description: "A participant's current outcome for a workshop.",
    properties: {
      participationStatus: {
        label: "Participation status",
        description: "The participant's current modeled outcome for the workshop.",
        valueType: "string",
        allowedValues: ["waitlisted", "confirmed"]
      }
    }
  },
  offeredPlace: {
    label: "Offered place",
    description: "A participant-specific offer to take a workshop place.",
    properties: {
      offeredPlaceStatus: {
        label: "Offered-place status",
        description: "Current participant-facing lifecycle state of the offered place.",
        valueType: "string",
        allowedValues: ["available", "expired", "unavailable", "accepted", "declined"]
      }
    }
  }
};

// Domain relationships
const domainRelationships = {
  workshopParticipationParticipant: {
    label: "Workshop participation participant",
    description: "A workshop participation records the outcome for a participant.",
    source: "workshopParticipation",
    target: "participant"
  },
  workshopParticipationWorkshop: {
    label: "Workshop participation workshop",
    description: "A workshop participation concerns the workshop whose registration or waitlist outcome is recorded.",
    source: "workshopParticipation",
    target: "workshop"
  },
  offeredPlaceParticipant: {
    label: "Offered-place participant",
    description: "An offered place concerns the participant whose workshop participation is changed or preserved by the response.",
    source: "offeredPlace",
    target: "participant"
  },
  offeredPlaceWorkshop: {
    label: "Offered-place workshop",
    description: "An offered place concerns the workshop whose place can be accepted or declined.",
    source: "offeredPlace",
    target: "workshop"
  }
};

// Domain operations
const domainOperations = {
  confirmWorkshopRegistration: {
    label: "Confirm workshop registration",
    description: "Establish confirmed participation for a participant when the selected workshop still has a registration place available and the participant is not already registered.",
    actsOn: ["workshop", "participant", "workshopParticipation"],
    preconditions: [
      "The workshop's registration availability is placeAvailable when confirmation is evaluated.",
      "The participant does not already have confirmed participation for the workshop."
    ],
    postconditions: [
      "The participant has confirmed participation for the workshop."
    ]
  },
  joinWorkshopWaitlist: {
    label: "Join workshop waitlist",
    description: "Establish waitlisted participation for a participant when the workshop is accepting waitlist registrations.",
    actsOn: ["workshop", "participant", "workshopParticipation"],
    preconditions: [
      "The workshop's registration availability is waitlistOpen when waitlist join is evaluated.",
      "The participant does not already have waitlisted participation for the workshop."
    ],
    postconditions: [
      "The participant has waitlisted participation for the workshop."
    ]
  },
  acceptOfferedPlace: {
    label: "Accept offered place",
    description: "Resolve an available offered place by confirming the participant for the offered workshop.",
    actsOn: ["offeredPlace", "participant", "workshop", "workshopParticipation"],
    preconditions: [
      "The offered place is available when acceptance is evaluated.",
      "The offered place concerns the participant whose participation is being resolved.",
      "The participant has waitlisted participation for the offered place's workshop."
    ],
    postconditions: [
      "The offered-place status is accepted.",
      "The participant has confirmed participation for the offered place's workshop."
    ]
  },
  declineOfferedPlace: {
    label: "Decline offered place",
    description: "Resolve an available offered place by declining it while leaving the participant waitlisted for the workshop.",
    actsOn: ["offeredPlace", "participant", "workshop", "workshopParticipation"],
    preconditions: [
      "The offered place is available when decline is evaluated.",
      "The offered place concerns the participant whose participation is being resolved.",
      "The participant has waitlisted participation for the offered place's workshop."
    ],
    postconditions: [
      "The offered-place status is declined.",
      "The participant remains waitlisted for the offered place's workshop."
    ]
  }
};

// Domain invariants
const domainInvariants = {
  offeredPlaceIntendedParticipant: {
    label: "Offered-place intended participant",
    description: "An offered place is reserved for the participant who received the offer.",
    appliesTo: ["offeredPlace", "participant"],
    assertion: "An offered place may be accepted or declined only by the participant for whom the offered place was offered."
  },
  offeredPlaceParticipationContinuity: {
    label: "Offered-place participation continuity",
    description: "Offer resolution affects the participation for the same participant and workshop as the offered place.",
    appliesTo: ["offeredPlace", "participant", "workshop", "workshopParticipation"],
    assertion: "Accepting or declining an offered place affects the workshop participation for the same participant and workshop as the offered place."
  }
};

// Domain logic functions
class WorkshopRegistrationDomain {
  constructor() {
    this.workshops = new Map();
    this.participants = new Map();
    this.participantRegistrations = new Map();
    this.offeredPlaces = new Map();
  }

  /**
   * Confirm a workshop registration if conditions are met
   */
  confirmRegistration(workshopId, participantId) {
    const workshop = this.workshops.get(workshopId);
    const participant = this.participants.get(participantId);
    
    // Validate preconditions
    if (!workshop) {
      throw new Error("Workshop not found");
    }
    
    if (!participant) {
      throw new Error("Participant not found");
    }
    
    if (workshop.registrationAvailability !== "placeAvailable") {
      throw new Error("Workshop registration not available");
    }
    
    // Check if participant already registered
    const existingRegistration = this.participantRegistrations.get(participantId);
    if (existingRegistration && existingRegistration.status === "confirmed") {
      throw new Error("Participant already registered");
    }
    
    // Update workshop registration count
    workshop.currentRegistrations++;
    
    // Create or update registration
    const registrationId = `reg_${Date.now()}`;
    this.participantRegistrations.set(registrationId, {
      id: registrationId,
      participantId,
      workshopId,
      status: "confirmed",
      createdAt: new Date()
    });
    
    return {
      id: registrationId,
      status: "confirmed",
      workshopId,
      participantId
    };
  }

  /**
   * Join a participant to workshop waitlist
   */
  joinWaitlist(workshopId, participantId) {
    const workshop = this.workshops.get(workshopId);
    const participant = this.participants.get(participantId);
    
    // Validate preconditions
    if (!workshop) {
      throw new Error("Workshop not found");
    }
    
    if (!participant) {
      throw new Error("Participant not found");
    }
    
    if (workshop.registrationAvailability !== "waitlistOpen") {
      throw new Error("Waitlist not available for this workshop");
    }
    
    // Check if participant already waitlisted
    const existingRegistration = this.participantRegistrations.get(participantId);
    if (existingRegistration && existingRegistration.status === "waitlisted") {
      throw new Error("Participant already waitlisted");
    }
    
    // Create waitlist registration
    const registrationId = `reg_${Date.now()}`;
    this.participantRegistrations.set(registrationId, {
      id: registrationId,
      participantId,
      workshopId,
      status: "waitlisted",
      createdAt: new Date()
    });
    
    return {
      id: registrationId,
      status: "waitlisted",
      workshopId,
      participantId
    };
  }

  /**
   * Accept offered place
   */
  acceptOfferedPlace(offerId, participantId) {
    const offer = this.offeredPlaces.get(offerId);
    
    if (!offer) {
      throw new Error("Offer not found");
    }
    
    if (offer.status !== "available") {
      throw new Error("Offer not available");
    }
    
    // Validate participant is the intended recipient
    if (offer.participantId !== participantId) {
      throw new Error("Offer not intended for this participant");
    }
    
    // Update offer status
    offer.status = "accepted";
    offer.resolvedAt = new Date();
    
    // Update participant's registration to confirmed
    const existingRegistration = this.participantRegistrations.get(participantId);
    if (existingRegistration) {
      existingRegistration.status = "confirmed";
    }
    
    return {
      id: offerId,
      status: "accepted",
      resolvedAt: offer.resolvedAt
    };
  }

  /**
   * Decline offered place
   */
  declineOfferedPlace(offerId, participantId) {
    const offer = this.offeredPlaces.get(offerId);
    
    if (!offer) {
      throw new Error("Offer not found");
    }
    
    if (offer.status !== "available") {
      throw new Error("Offer not available");
    }
    
    // Validate participant is the intended recipient
    if (offer.participantId !== participantId) {
      throw new Error("Offer not intended for this participant");
    }
    
    // Update offer status
    offer.status = "declined";
    offer.resolvedAt = new Date();
    
    // Participant stays waitlisted
    const existingRegistration = this.participantRegistrations.get(participantId);
    if (existingRegistration) {
      existingRegistration.status = "waitlisted";
    }
    
    return {
      id: offerId,
      status: "declined",
      resolvedAt: offer.resolvedAt
    };
  }
}

// Export the domain functionalities
export { 
  domainEntities, 
  domainRelationships, 
  domainOperations, 
  domainInvariants,
  WorkshopRegistrationDomain
};