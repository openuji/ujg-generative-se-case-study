export const diagrams = {
  domainFirst: `flowchart LR
    A["Briefing / Whiteboard"] --> B["Semi-shared understanding<br/>of the problem"]
    B --> C["Domain"]
    C --> D["UI / Surface"]
    C --> E["Backend / Logic"]`,

  interactionFirst: `flowchart LR
    A["Problem to solve"] --> B["Intended user interaction"]
    B --> C["Semantic interaction model"]
    C --> D["Surface requirements"]
    C --> E["Domain requirements"]
    D --> F["UI"]
    E --> G["Backend"]`,

  interactionGraph: `flowchart LR
    A["State A"] -->|Transition Z| B["State B"]
    B -->|Transition X| C["State C"]
    B -->|Transition Y| D["State D"]`,

  ujgExtendGraph: `flowchart LR
    subgraph UJG["UJG semantic boundary"]
        G["Graph<br/><small>spec</small>"]
        S["Surface<br/><small>spec</small>"]
        D["Domain Model<br/><small>extension</small>"]

        G --> S
        G --> D
    end`,

  semanticLoop: `flowchart LR
    subgraph UJG["UJG semantic boundary"]
        G["Graph"]
        S["Surface"]
        D["Domain Model"]
        R["Runtime"]
        M["Metrics"]

        G --> S
        G --> D
        R --> M
        M -. "feedback against intent" .-> G
    end

    S -->|"materialize"| UI["UI"]
    U["User"] -->|"interacts"| UI
    UI -->|"observed interaction"| R`,

  aiRealization: `flowchart LR
    subgraph UJG["UJG realization context"]
        G["Graph"]
        S["Surface"]
        D["Domain Model"]

        G --> S
        G --> D
    end

    UJG --> C["Realization context"]
    C --> AI["Generative AI<br/>+ realization skills"]

    AI --> UI["UI"]
    AI --> BE["Backend / Runtime"]`,

  workshopCase: `flowchart LR
    O["Workshop overview"] --> D["Workshop detail"]

    D --> R["Registration open"]
    D --> W["Waitlist open"]
    D --> C["Registration closed"]

    R --> RF["Registration details"]
    RF --> RR["Review"]
    RR --> RC["Registration confirmed"]

    W --> WF["Waitlist details"]
    WF --> WW["Waitlisted"]

    E["Offered-place email"] --> OP["Offered-place screen"]
    OP -->|Accept| RC
    OP -->|Decline| WW

    classDef email fill:#fff7e6,stroke:#c08b18,stroke-width:3px
    class E,OP email`,

  journeyRepair: `flowchart LR
    U["UJG<br/>selected journey paths"] --> A["Generative agent"]
    A --> APP["Application"]

    APP --> JM["JourneyMesh"]
    U --> JM

    JM --> RUN["Execute selected<br/>journey paths"]
    RUN --> V{"Journey correct?"}

    V -->|No| F["Failure evidence"]
    F --> A

    V -->|Yes| DONE["Path accepted"]`,

  syntheticUsers: `flowchart LR
    subgraph UJG["UJG semantic boundary"]
        G["Graph"]
        S["Surface"]
        D["Domain Model"]
        R["Runtime"]
        M["Metrics"]

        G --> S
        G --> D
        R --> M
        M -. "interpret against intent" .-> G
    end

    S --> UI["UI"]

    AIU["Synthetic AI User"] -->|"interacts"| UI
    UI -->|"runtime evidence"| R`,

  graphql: `flowchart LR
    subgraph UJG["UJG"]
        G["Graph"]
        S["Nested Surface tree"]
        D["Domain Model"]

        G --> S
        G --> D
    end

    S --> Q["Compose GraphQL<br/>selection"]
    Q --> B["Backend API"]

    D --> B

    B --> DATA["GraphQL response"]
    DATA --> UI["Materialized UI"]`
};
