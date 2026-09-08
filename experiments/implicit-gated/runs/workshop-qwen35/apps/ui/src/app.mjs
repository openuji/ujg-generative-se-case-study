// UJG Workshop Registration UI Application
// This file implements the browser interface for the workshop registration system
import { createServer } from 'http';
import express from 'express';
import path from 'path';

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Set up middleware
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// API endpoints for workshop registration
// These implement the UJG's journey entry points and transitions

// Entry point: Workshops overview
app.get('/api/workshops/overview', (req, res) => {
  // This would return the workshop teasers as expected by the UJG
  res.json({
    entries: [
      {
        id: 'workshop-teaser',
        type: 'composite-state',
        label: 'Workshop Teaser',
        content: []
      }
    ]
  });
});

// Entry point: Workshop detail
app.get('/api/workshops/:id/detail', (req, res) => {
  // Return workshop detail
  const workshopId = req.params.id;
  res.json({
    id: workshopId,
    title: `Workshop Title ${workshopId}`,
    description: `Description for workshop ${workshopId}`,
    date: `2024-06-${10 + parseInt(workshopId)}`,
    location: 'Virtual',
    registrationStatus: 'placeAvailable',
    maxParticipants: 20,
    currentRegistrations: 5
  });
});

// Entry point: Offered place email
app.get('/api/workshops/offered-place-email/:id', (req, res) => {
  // Return email content for the offered place
  const offerId = req.params.id;
  res.json({
    id: offerId,
    subject: 'You have been offered a place!',
    body: 'Congratulations! You have been offered a place for the workshop.'
  });
});

// Entry point: Offered place application
app.get('/api/workshops/offered-place-app/:id', (req, res) => {
  // Return the application form for offered place
  const offerId = req.params.id;
  res.json({
    id: offerId,
    title: 'Accept Offered Place',
    fields: [
      {
        name: 'accept',
        type: 'checkbox',
        label: 'Accept the place'
      }
    ]
  });
});

// Registration flow for workshop
app.post('/api/workshops/:id/register', (req, res) => {
  // Handle registration request
  res.json({
    message: 'Registration initiated',
    action: 'confirm-workshop-registration',
    status: 'registration-confirmed'
  });
});

// Join waitlist for workshop
app.post('/api/workshops/:id/join-waitlist', (req, res) => {
  // Handle waitlist request
  res.json({
    message: 'Added to waitlist',
    action: 'join-workshop-waitlist',
    status: 'waitlisted'
  });
});

// Handle offered place response
app.post('/api/workshops/offered-place/:id/respond', (req, res) => {
  // Handle accept/decline of offered place
  const { action } = req.body;
  res.json({
    message: `Offer ${action}ed`,
    action: `accept-offered-place` // or `decline-offered-place` based on action
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Workshop Registration UI app listening at http://localhost:${port}`);
});

export default app;