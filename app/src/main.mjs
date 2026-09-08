import express from 'express';
import { createServer } from 'http';
import { Database } from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// In-memory database for demonstration (in real app would use SQLite)
let db = new Database(':memory:');

// Create tables for workshop registration system
const createTables = () => {
  db.serialize(() => {
    // Create workshops table
    db.run(`CREATE TABLE IF NOT EXISTS workshops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT,
      location TEXT,
      registration_available TEXT,
      max_participants INTEGER,
      current_registrations INTEGER DEFAULT 0
    )`);
    
    // Create participants table
    db.run(`CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Create workshop registrations table
    db.run(`CREATE TABLE IF NOT EXISTS workshop_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workshop_id INTEGER,
      participant_id INTEGER,
      status TEXT, -- 'confirmed', 'waitlisted', 'offered-place',
      registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workshop_id) REFERENCES workshops(id),
      FOREIGN KEY (participant_id) REFERENCES participants(id)
    )`);
    
    // Create offered places table
    db.run(`CREATE TABLE IF NOT EXISTS offered_places (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workshop_id INTEGER,
      participant_id INTEGER,
      status TEXT, -- 'available', 'accepted', 'declined', 'expired'
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workshop_id) REFERENCES workshops(id),
      FOREIGN KEY (participant_id) REFERENCES participants(id)
    )`);
    
    // Create workshop-teaser data table
    db.run(`CREATE TABLE IF NOT EXISTS workshop_teasers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workshop_id INTEGER,
      title TEXT,
      summary TEXT,
      date TEXT,
      location TEXT,
      FOREIGN KEY (workshop_id) REFERENCES workshops(id)
    )`);
    
    // Create schema validation table for the data structures
    db.run(`CREATE TABLE IF NOT EXISTS schema_registry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schema_name TEXT UNIQUE NOT NULL,
      schema_content TEXT NOT NULL
    )`);
  });
};

// Initialize database
createTables();

// Workshop teaser data (seed data)
const workshopTeasers = [
  {
    workshop_id: 1,
    title: "Introduction to UJG",
    summary: "Learn about User Journey Graphs and how they can improve application architecture",
    date: "2024-06-15",
    location: "Virtual"
  },
  {
    workshop_id: 2,
    title: "Domain Modeling with UJG",
    summary: "Explore how to build domain models using UJG specifications",
    date: "2024-06-20",
    location: "San Francisco"
  },
  {
    workshop_id: 3,
    title: "Design System Implementation",
    summary: "Learn how to implement design systems based on UJG specifications",
    date: "2024-06-25",
    location: "Online"
  }
];

// Seed data for workshops
const workshops = [
  {
    title: "Introduction to UJG",
    description: "Learn about User Journey Graphs and how they can improve application architecture",
    date: "2024-06-15",
    location: "Virtual",
    registration_available: "placeAvailable",
    max_participants: 20,
    current_registrations: 0
  },
  {
    title: "Domain Modeling with UJG",
    description: "Explore how to build domain models using UJG specifications",
    date: "2024-06-20",
    location: "San Francisco",
    registration_available: "waitlistOpen",
    max_participants: 15,
    current_registrations: 15
  },
  {
    title: "Design System Implementation",
    description: "Learn how to implement design systems based on UJG specifications",
    date: "2024-06-25",
    location: "Online",
    registration_available: "registrationClosed",
    max_participants: 10,
    current_registrations: 10
  }
];

// Seed workshop teasers
const seedWorkshopTeasers = () => {
  db.serialize(() => {
    // Insert workshop teasers
    const stmt = db.prepare(
      "INSERT OR REPLACE INTO workshop_teasers (workshop_id, title, summary, date, location) VALUES (?, ?, ?, ?, ?)"
    );
    
    workshopTeasers.forEach(teaser => {
      stmt.run(
        teaser.workshop_id,
        teaser.title,
        teaser.summary,
        teaser.date,
        teaser.location
      );
    });
    
    stmt.finalize();
    
    // Insert workshops
    const workshopStmt = db.prepare(
      "INSERT OR REPLACE INTO workshops (id, title, description, date, location, registration_available, max_participants, current_registrations) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );
    
    workshops.forEach((workshop, index) => {
      workshopStmt.run(
        index + 1,
        workshop.title,
        workshop.description,
        workshop.date,
        workshop.location,
        workshop.registration_available,
        workshop.max_participants,
        workshop.current_registrations
      );
    });
    
    workshopStmt.finalize();
  });
};

// Seed the database
seedWorkshopTeasers();

// API Routes

// Get all workshops overview (workshop teaser)
app.get('/api/workshops', (req, res) => {
  db.all(
    "SELECT wt.workshop_id, wt.title, wt.summary, wt.date, wt.location FROM workshop_teasers wt ORDER BY wt.date",
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        workshops: rows
      });
    }
  );
});

// Get specific workshop detail with registration status
app.get('/api/workshops/:id', (req, res) => {
  const id = req.params.id;
  
  db.all(
    `SELECT 
      w.id as workshop_id,
      w.title,
      w.description,
      w.date,
      w.location,
      w.registration_available,
      w.max_participants,
      w.current_registrations,
      wt.title as teaser_title,
      wt.summary as teaser_summary
    FROM workshops w 
    JOIN workshop_teasers wt ON w.id = wt.workshop_id
    WHERE w.id = ?`,
    [id],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (rows.length === 0) {
        res.status(404).json({ error: "Workshop not found" });
        return;
      }
      
      const workshop = rows[0];
      
      // Determine the appropriate state based on registration availability
      let state = "workshop-registration-closed";
      if (workshop.registration_available === "placeAvailable") {
        state = "workshop-registration-open";
      } else if (workshop.registration_available === "waitlistOpen") {
        state = "workshop-waitlist-open";
      } else if (workshop.registration_available === "registrationClosed") {
        state = "workshop-registration-closed";
      }
      
      res.json({
        workshop: {
          id: workshop.workshop_id,
          title: workshop.title,
          description: workshop.description,
          date: workshop.date,
          location: workshop.location,
          registration_status: workshop.registration_available,
          max_participants: workshop.max_participants,
          current_registrations: workshop.current_registrations,
          state: state,
          teaser: {
            title: workshop.teaser_title,
            summary: workshop.teaser_summary
          }
        }
      });
    }
  );
});

// Register for a workshop (if registration is open)
app.post('/api/workshops/:id/register', (req, res) => {
  const id = req.params.id;
  const { participantName, participantEmail } = req.body;
  
  // Validate input
  if (!participantName || !participantEmail) {
    return res.status(400).json({ error: "Name and email are required" });
  }
  
  // Check if participant exists
  db.get(
    "SELECT id FROM participants WHERE email = ?",
    [participantEmail],
    (err, participant) => {
      let participantId = null;
      
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!participant) {
        // Create new participant
        db.run(
          "INSERT INTO participants (name, email) VALUES (?, ?)",
          [participantName, participantEmail],
          function(err) {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            participantId = this.lastID;
            processRegistration();
          }
        );
      } else {
        participantId = participant.id;
        processRegistration();
      }
      
      function processRegistration() {
        // Get current workshop state
        db.get(
          "SELECT registration_available, current_registrations, max_participants FROM workshops WHERE id = ?",
          [id],
          (err, workshop) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            
            if (!workshop) {
              return res.status(404).json({ error: "Workshop not found" });
            }
            
            // Determine if registration should be confirmed or added to waitlist
            let status = "confirmed";
            if (workshop.registration_available === "placeAvailable") {
              // Check if there's still space
              if (workshop.current_registrations >= workshop.max_participants) {
                status = "waitlisted";
              }
            } else if (workshop.registration_available === "waitlistOpen") {
              // If waitlist open, add to waitlist
              status = "waitlisted";
            } else {
              // Registration closed, cannot add
              return res.status(400).json({ error: "Registration is closed for this workshop" });
            }
            
            // Add registration
            db.run(
              "INSERT INTO workshop_registrations (workshop_id, participant_id, status) VALUES (?, ?, ?)",
              [id, participantId, status],
              function(err) {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }
                
                // Update workshop registration count if not waitlisted
                if (status === "confirmed") {
                  db.run(
                    "UPDATE workshops SET current_registrations = current_registrations + 1 WHERE id = ?",
                    [id],
                    (err) => {
                      if (err) {
                        return res.status(500).json({ error: err.message });
                      }
                      res.json({
                        message: `Registration ${status} for workshop`,
                        registration_id: this.lastID,
                        status: status
                      });
                    }
                  );
                } else {
                  res.json({
                    message: `Registered for waitlist for workshop`,
                    registration_id: this.lastID,
                    status: status
                  });
                }
              }
            );
          }
        );
      }
    }
  );
});

// Join waitlist for workshop
app.post('/api/workshops/:id/join-waitlist', (req, res) => {
  const id = req.params.id;
  const { participantName, participantEmail } = req.body;
  
  // Validate input
  if (!participantName || !participantEmail) {
    return res.status(400).json({ error: "Name and email are required" });
  }
  
  // Check if participant exists
  db.get(
    "SELECT id FROM participants WHERE email = ?",
    [participantEmail],
    (err, participant) => {
      let participantId = null;
      
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!participant) {
        // Create new participant
        db.run(
          "INSERT INTO participants (name, email) VALUES (?, ?)",
          [participantName, participantEmail],
          function(err) {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            participantId = this.lastID;
            processWaitlist();
          }
        );
      } else {
        participantId = participant.id;
        processWaitlist();
      }
      
      function processWaitlist() {
        // Check workshop registration status
        db.get(
          "SELECT registration_available FROM workshops WHERE id = ?",
          [id],
          (err, workshop) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            
            if (!workshop) {
              return res.status(404).json({ error: "Workshop not found" });
            }
            
            // Only add to waitlist if waitlist is open
            if (workshop.registration_available !== "waitlistOpen") {
              return res.status(400).json({ error: "Waitlist is not available for this workshop" });
            }
            
            // Add to waitlist
            db.run(
              "INSERT INTO workshop_registrations (workshop_id, participant_id, status) VALUES (?, ?, ?)",
              [id, participantId, "waitlisted"],
              function(err) {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }
                
                res.json({
                  message: "Added to waitlist for workshop",
                  registration_id: this.lastID,
                  status: "waitlisted"
                });
              }
            );
          }
        );
      }
    }
  );
});

// Review workshop registration
app.get('/api/workshops/:id/registration-review', (req, res) => {
  const id = req.params.id;
  
  // Check if participant is registered for workshop
  db.all(
    `SELECT 
      wr.id as registration_id,
      p.name,
      p.email,
      wr.status,
      w.title as workshop_title,
      w.date as workshop_date
    FROM workshop_registrations wr
    JOIN participants p ON wr.participant_id = p.id
    JOIN workshops w ON wr.workshop_id = w.id
    WHERE wr.workshop_id = ?`,
    [id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({
        registrations: rows
      });
    }
  );
});

// Get offered places for participant
app.get('/api/workshops/offered-places/:email', (req, res) => {
  const email = req.params.email;
  
  // Find participant
  db.get(
    "SELECT id FROM participants WHERE email = ?",
    [email],
    (err, participant) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }
      
      // Get offered places for this participant
      db.all(
        `SELECT 
          op.id as offer_id,
          op.status,
          w.title as workshop_title,
          w.date as workshop_date,
          op.expires_at,
          op.created_at
        FROM offered_places op
        JOIN participants p ON op.participant_id = p.id
        JOIN workshops w ON op.workshop_id = w.id
        WHERE p.id = ? AND op.status = 'available'`,
        [participant.id],
        (err, rows) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          res.json({
            offers: rows
          });
        }
      );
    }
  );
});

// Accept or decline offered place
app.post('/api/workshops/offered-places/:id/respond', (req, res) => {
  const id = req.params.id;
  const { action } = req.body; // action should be "accept" or "decline"
  
  if (!action || !['accept', 'decline'].includes(action)) {
    return res.status(400).json({ error: "Invalid action. Must be 'accept' or 'decline'" });
  }
  
  // Get offered place details  
  db.get(
    "SELECT id, status, participant_id, workshop_id FROM offered_places WHERE id = ?",
    [id],
    (err, offer) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!offer || offer.status !== "available") {
        return res.status(400).json({ error: "Invalid offer or offer not available" });
      }
      
      // Update offer status
      const newStatus = action === 'accept' ? 'accepted' : 'declined';
      db.run(
        "UPDATE offered_places SET status = ? WHERE id = ?",
        [newStatus, id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          // If accepted, confirm the registration
          if (action === 'accept') {
            // Check if participant already has registration
            db.run(
              "UPDATE workshop_registrations SET status = 'confirmed' WHERE participant_id = ? AND workshop_id = ?",
              [offer.participant_id, offer.workshop_id],
              function(err) {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }
                
                res.json({
                  message: "Offer accepted and registration confirmed",
                  offer_id: id,
                  status: newStatus
                });
              }
            );
          } else {
            res.json({
              message: "Offer declined",
              offer_id: id,
              status: newStatus
            });
          }
        }
      );
    }
  );
});

// Serve static files from public directory
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../public', 'index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Workshop registration app listening at http://localhost:${port}`);
});

export default app;