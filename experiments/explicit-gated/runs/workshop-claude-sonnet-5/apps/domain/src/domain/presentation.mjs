/**
 * Builds the documents the workshop screens read.
 *
 * Every builder here produces a value that satisfies one of the product's
 * authored form, summary, status or notice contracts, so the same document goes
 * on the wire, into the API description, and into the rendered screen.
 */

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "UTC"
});

export function formatMoment(isoTimestamp) {
  return `${dateFormat.format(new Date(isoTimestamp))} UTC`;
}

export function availabilityWording(workshop) {
  switch (workshop.registration_availability) {
    case "placeAvailable":
      return workshop.remaining_places === 1
        ? "1 place available"
        : `${workshop.remaining_places} places available`;
    case "waitlistOpen":
      return "Fully booked — waitlist open";
    default:
      return "Registration closed";
  }
}

export function workshopTeaser(workshop) {
  return {
    title: workshop.title,
    summary: workshop.summary,
    date: workshop.scheduled_for,
    location: workshop.location
  };
}

export function workshopDetail(workshop) {
  return {
    title: workshop.title,
    description: workshop.description,
    date: workshop.scheduled_for,
    location: workshop.location,
    availability: availabilityWording(workshop)
  };
}

export function offerSummary(offer, workshop) {
  return {
    title: "A place has opened up",
    message:
      "You are on the waitlist for this workshop and a place is being held for you. Take it or pass it on before the offer runs out.",
    workshopTitle: workshop.title,
    expiresAt: formatMoment(offer.expires_at)
  };
}

/**
 * What a participant is shown to check over before their details are recorded.
 * The workshop title comes from the catalogue rather than the submission, so a
 * review always names the workshop the service is about to act on.
 */
export function registrationReview(workshop, details) {
  return {
    workshopTitle: workshop.title,
    name: details.name,
    email: details.email
  };
}

export function waitlistReview(workshop, details) {
  return {
    workshopTitle: workshop.title,
    name: details.name,
    email: details.email
  };
}

function participantDetails(workshop, participation) {
  return [
    { term: "Workshop", value: workshop.title },
    { term: "Name", value: participation.name },
    { term: "Email", value: participation.email }
  ];
}

export function registrationConfirmedMessage(workshop, participation) {
  return {
    title: "Your place is booked",
    message: `You are registered for ${workshop.title}. A confirmation is on its way to ${participation.email}.`,
    tone: "success",
    details: participantDetails(workshop, participation)
  };
}

export function registrationAlreadyConfirmedMessage(workshop, participation) {
  return {
    title: "You are already registered",
    message: `Your place on ${workshop.title} was already booked, so nothing has changed.`,
    tone: "info",
    details: participantDetails(workshop, participation)
  };
}

export function waitlistedMessage(workshop, participation) {
  return {
    title: "You are on the waitlist",
    message: `We will write to ${participation.email} as soon as a place on ${workshop.title} opens up.`,
    tone: "success",
    details: participantDetails(workshop, participation)
  };
}

export function alreadyWaitlistedMessage(workshop, participation) {
  return {
    title: "You are already on the waitlist",
    message: `You joined the waitlist for ${workshop.title} earlier, so your place in the queue is unchanged.`,
    tone: "info",
    details: participantDetails(workshop, participation)
  };
}

export function registrationClosedMessage(workshop) {
  return {
    title: "Registration has closed",
    message: `${workshop.title} is no longer taking registrations or waitlist entries.`,
    tone: "warning",
    details: [
      { term: "Workshop", value: workshop.title },
      { term: "Date", value: workshop.scheduled_for }
    ]
  };
}

export function alreadyRegisteredNotice(workshop) {
  return {
    message: `You already have a place on ${workshop.title}.`,
    tone: "success"
  };
}

export function alreadyWaitlistedNotice(workshop) {
  return {
    message: `You are on the waitlist for ${workshop.title}. We will be in touch if a place opens up.`,
    tone: "info"
  };
}

export function offerExpiredMessage(offer, workshop) {
  return {
    title: "This offer has run out",
    message: `The place we were holding on ${workshop.title} was only available until ${formatMoment(offer.expires_at)}. You are still on the waitlist.`,
    tone: "warning",
    details: [
      { term: "Workshop", value: workshop.title },
      { term: "Offer expired", value: formatMoment(offer.expires_at) }
    ]
  };
}

export function offerUnavailableMessage(offer, workshop) {
  return {
    title: "This place is no longer available",
    message: `The place on ${workshop.title} was withdrawn before you answered. You are still on the waitlist.`,
    tone: "error",
    details: [{ term: "Workshop", value: workshop.title }]
  };
}

export function offerAcceptedMessage(offer, workshop, participation) {
  return {
    title: "Your place is booked",
    message: `You accepted the place on ${workshop.title}. A confirmation is on its way to ${participation.email}.`,
    tone: "success",
    details: participantDetails(workshop, participation)
  };
}

export function offerDeclinedMessage(offer, workshop, participation) {
  return {
    title: "You stay on the waitlist",
    message: `You passed on the place for ${workshop.title}, so you keep your position on the waitlist.`,
    tone: "info",
    details: participantDetails(workshop, participation)
  };
}
