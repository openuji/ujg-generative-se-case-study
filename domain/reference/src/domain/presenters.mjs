const availabilityLabel = {
  placeAvailable: "Registration open",
  waitlistOpen: "Waitlist open",
  registrationClosed: "Registration closed"
};

export const workshopTeaser = (workshop) => ({
  title: workshop.title,
  summary: workshop.summary,
  date: workshop.date,
  location: workshop.location
});

export const workshopDetail = (workshop, availability = availabilityLabel[workshop.availability]) => ({
  title: workshop.title,
  description: workshop.description,
  date: workshop.date,
  location: workshop.location,
  availability
});

export const registrationClosed = () => ({
  title: "Registration closed",
  message: "Registration for this workshop is closed.",
  tone: "error"
});

export const confirmed = (workshop) => ({
  title: "Registration confirmed",
  message: "Your place has been confirmed.",
  tone: "success",
  details: [{ term: "Workshop", value: workshop.title }]
});

export const alreadyRegistered = (workshop) => ({
  title: "Already registered",
  message: "You are already registered for this workshop.",
  tone: "success",
  details: [{ term: "Workshop", value: workshop.title }]
});

export const alreadyConfirmed = (workshop) => ({
  title: "Registration already confirmed",
  message: "You are already registered for this workshop.",
  tone: "success",
  details: [{ term: "Workshop", value: workshop.title }]
});

export const waitlisted = (workshop, already = false) => ({
  title: already ? "Already waitlisted" : "Waitlisted",
  message: already
    ? "You are already on the waitlist for this workshop."
    : "You are on the waitlist for this workshop.",
  tone: "info",
  details: [{ term: "Workshop", value: workshop.title }]
});

export const alreadyRegisteredDetail = (workshop) => ({
  summary: workshopDetail(workshop, "Already registered"),
  status: alreadyRegistered(workshop)
});

export const alreadyWaitlistedDetail = (workshop) => ({
  summary: workshopDetail(workshop, "Already waitlisted"),
  status: waitlisted(workshop, true)
});

export const offerSummary = (offer, workshop) => ({
  title: "Offered place",
  message: "Review the available place and choose how to respond.",
  workshopTitle: workshop.title,
  expiresAt: offer.expires_at
});

const offerStatuses = {
  expired: {
    title: "Offer expired",
    message: "This offered place has expired.",
    tone: "warning"
  },
  unavailable: {
    title: "Offer unavailable",
    message: "This offered place is no longer available.",
    tone: "error"
  },
  accepted: {
    title: "Registration confirmed",
    message: "You accepted the offered place.",
    tone: "success"
  },
  declined: {
    title: "Still waitlisted",
    message: "You declined the offered place and remain on the waitlist.",
    tone: "info"
  }
};

export const offerStatus = (status, workshop) => ({
  ...offerStatuses[status],
  details: [{ term: "Workshop", value: workshop.title }]
});
