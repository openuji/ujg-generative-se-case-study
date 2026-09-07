const workshops = [
  {
    id: "service-design-foundations",
    title: "Service Design Foundations",
    summary: "A hands-on session for learning practical service design techniques.",
    description: "A practical workshop with exercises, review points, and guided facilitation.",
    date: "15 October",
    location: "Berlin studio",
    availability: "placeAvailable"
  },
  {
    id: "facilitation-practice",
    title: "Facilitation Practice",
    summary: "Practice facilitating collaborative sessions with structured feedback.",
    description: "The workshop is currently full, but waitlist places can still be requested.",
    date: "18 October",
    location: "Berlin studio",
    availability: "waitlistOpen"
  },
  {
    id: "research-operations",
    title: "Research Operations",
    summary: "Build sustainable systems for organizing research knowledge.",
    description: "A focused workshop on repositories, consent, recruitment, and research governance.",
    date: "22 October",
    location: "Online",
    availability: "registrationClosed"
  }
];

const participants = [
  { id: "participant-alex", name: "Alex Nguyen", email: "alex@example.com", token: "token-alex" },
  { id: "participant-blair", name: "Blair Jensen", email: "blair@example.com", token: "token-blair" }
];

const offers = [
  {
    id: "offer-alex-open",
    participantId: "participant-alex",
    workshopId: "facilitation-practice",
    status: "available",
    expiresAt: "2099-10-18T12:00:00.000Z"
  },
  {
    id: "offer-alex-expired",
    participantId: "participant-alex",
    workshopId: "facilitation-practice",
    status: "available",
    expiresAt: "2020-10-18T12:00:00.000Z"
  },
  {
    id: "offer-alex-unavailable",
    participantId: "participant-alex",
    workshopId: "facilitation-practice",
    status: "unavailable",
    expiresAt: "2099-10-18T12:00:00.000Z"
  }
];

export async function loadFixtures(store, emailClient, { appBaseUrl = "http://localhost:5173" } = {}) {
  const db = store.database;
  db.exec("DELETE FROM offers; DELETE FROM participations; DELETE FROM participants; DELETE FROM workshops;");

  const insertWorkshop = db.prepare(`
    INSERT INTO workshops (id, title, summary, description, date, location, availability)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const item of workshops) {
    insertWorkshop.run(item.id, item.title, item.summary, item.description, item.date, item.location, item.availability);
  }

  const insertParticipant = db.prepare(
    "INSERT INTO participants (id, name, email, auth_token) VALUES (?, ?, ?, ?)"
  );
  for (const item of participants) insertParticipant.run(item.id, item.name, item.email, item.token);

  store.saveParticipation({
    participantId: "participant-alex",
    workshopId: "service-design-foundations",
    status: "confirmed",
    name: "Alex Nguyen",
    email: "alex@example.com",
    now: "2026-01-01T00:00:00.000Z"
  });

  store.saveParticipation({
    participantId: "participant-alex",
    workshopId: "facilitation-practice",
    status: "waitlisted",
    name: "Alex Nguyen",
    email: "alex@example.com",
    now: "2026-01-01T00:00:00.000Z"
  });

  const insertOffer = db.prepare(`
    INSERT INTO offers (id, participant_id, workshop_id, status, expires_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const item of offers) {
    insertOffer.run(item.id, item.participantId, item.workshopId, item.status, item.expiresAt, "2026-01-01T00:00:00.000Z");
  }

  await emailClient.reset();
  const participantById = new Map(participants.map((item) => [item.id, item]));
  const workshopById = new Map(workshops.map((item) => [item.id, item]));
  for (const offer of offers.filter(({ status, expiresAt }) => status === "available" && Date.parse(expiresAt) > Date.parse("2026-01-01T00:00:00.000Z"))) {
    await emailClient.send({
      to: participantById.get(offer.participantId).email,
      subject: `A place is available: ${workshopById.get(offer.workshopId).title}`,
      body: {
        title: "A workshop place is available",
        message: "A place has opened for you from the waitlist.",
        workshopTitle: workshopById.get(offer.workshopId).title,
        expiresAt: offer.expiresAt
      },
      action: {
        label: "Open offered place",
        href: `${appBaseUrl}/offers/${offer.id}`
      }
    });
  }
  if (typeof emailClient.flush === "function") await emailClient.flush();
}
