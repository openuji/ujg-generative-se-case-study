import { ComparisonChart } from "./ComparisonChart";
import { MermaidDiagram } from "./MermaidDiagram";
import { diagrams } from "./diagrams";
import type { DeckPage } from "./types";

const slideCount = 8;

export const pages: DeckPage[] = [
  {
    id: "slide-1-step-1",
    conceptualSlide: 1,
    conceptualSlideCount: slideCount,
    step: 1,
    stepCount: 1,
    title: "UJG started from frustration.",
    layout: "statement",
    content: (
      <div className="frustration-layout">
        <div className="artifact-islands" aria-label="Disconnected artifacts">
          <div className="artifact island-whiteboard">
            <span className="artifact-label">Whiteboard</span>
          </div>
          <div className="artifact island-figma">
            <span className="artifact-label">Figma</span>
          </div>
          <div className="artifact island-jira">
            <span className="artifact-label">Jira</span>
          </div>
          <div className="artifact island-git">
            <span className="artifact-label">Git</span>
          </div>
        </div>
        <p className="major-line">Same product. Different representations.</p>
        <p className="closing-line">
          Each artifact captures part of what the application should be, but
          there is no shared semantic source of truth for the intended user
          interaction.
        </p>
      </div>
    )
  },
  {
    id: "slide-2-step-1",
    conceptualSlide: 2,
    conceptualSlideCount: slideCount,
    step: 1,
    stepCount: 2,
    title: "We usually start with the domain.",
    layout: "diagram",
    content: (
      <>
        <MermaidDiagram chart={diagrams.domainFirst} label="Domain-first flow" />
        <p className="support-line">
          We agree on some understanding of the problem, call it the domain,
          and derive the product from there.
        </p>
      </>
    )
  },
  {
    id: "slide-2-step-2",
    conceptualSlide: 2,
    conceptualSlideCount: slideCount,
    step: 2,
    stepCount: 2,
    title: "What if intended interaction is upstream?",
    layout: "diagram",
    content: (
      <>
        <MermaidDiagram
          chart={diagrams.interactionFirst}
          label="Interaction-first flow"
        />
        <p className="major-line compact">
          Describe the problem through how users should meaningfully interact
          with the system, then derive the surface and relevant domain
          requirements.
        </p>
        <p className="support-line">
          Interaction semantics can become a first-class upstream model
          alongside domain modeling.
        </p>
      </>
    )
  },
  {
    id: "slide-3-step-1",
    conceptualSlide: 3,
    conceptualSlideCount: slideCount,
    step: 1,
    stepCount: 1,
    title: "How can we formally describe user interaction?",
    eyebrow: "A graph is a natural fit.",
    layout: "diagram",
    content: (
      <>
        <MermaidDiagram
          chart={diagrams.interactionGraph}
          label="Interaction graph with states, transitions, conditions, and outcomes"
        />
        <div className="concept-strip">
          <span>State</span>
          <span>Transition</span>          
        </div>
        <p className="support-line">
          Once interaction becomes a graph, its meaningful parts can have
          explicit semantics and stable identities.
        </p>
      </>
    )
  },
  {
    id: "slide-4-step-1",
    conceptualSlide: 4,
    conceptualSlideCount: slideCount,
    step: 1,
    stepCount: 2,
    title: "UJG extends the interaction graph.",
    layout: "diagram",
    content: (
      <>
        <MermaidDiagram
          chart={diagrams.ujgExtendGraph}
          label="UJG semantic boundary around graph, surface, and domain model"
        />
        <p className="support-line">
          The interaction graph can be enriched with the information required
          to understand how that interaction may be surfaced and which domain
          concepts support it.
        </p>
      </>
    )
  },
  {
    id: "slide-4-step-2",
    conceptualSlide: 4,
    conceptualSlideCount: slideCount,
    step: 2,
    stepCount: 2,
    title: "UJG closes the semantic loop.",
    layout: "diagram",
    content: (
      <>
        <MermaidDiagram
          chart={diagrams.semanticLoop}
          label="UJG semantic loop from intent to materialization, runtime, metrics, and feedback"
        />
        <p className="major-line accent">
          Intent <span aria-hidden="true">-&gt;</span> materialization{" "}
          <span aria-hidden="true">-&gt;</span> interaction{" "}
          <span aria-hidden="true">-&gt;</span> observation{" "}
          <span aria-hidden="true">-&gt;</span> interpretation
        </p>
      </>
    )
  },
  {
    id: "slide-5-step-1",
    conceptualSlide: 5,
    conceptualSlideCount: slideCount,
    step: 1,
    stepCount: 2,
    title: "Could the same semantic core be enough context for generative AI?",
    layout: "diagram",
    content: (
      <>
        <MermaidDiagram
          chart={diagrams.aiRealization}
          label="UJG realization context passed to generative AI"
        />
        <p className="support-line">
          The AI is not asked to invent the interaction scope from a generic
          prompt. It is asked to realize an explicitly specified interaction.
        </p>
        <p className="meta-note">Same semantic source, multiple implementation models.</p>
      </>
    )
  },
  {
    id: "slide-5-step-2",
    conceptualSlide: 5,
    conceptualSlideCount: slideCount,
    step: 2,
    stepCount: 2,
    title: "Case study: workshop registration",
    layout: "diagram",
    content: (
      <>
        <MermaidDiagram
          chart={diagrams.workshopCase}
          label="Workshop registration topology"
          className="tall-diagram"
        />
        <p className="support-line">
          Browser and email touchpoints, branches, conditions, outcomes and
          domain effects originate from the same UJG source.
        </p>
      </>
    )
  },
  {
    id: "slide-6-step-1",
    conceptualSlide: 6,
    conceptualSlideCount: slideCount,
    step: 1,
    stepCount: 1,
    title: "Same semantic source. Different generative models.",
    eyebrow: "Frozen inputs. Same realization procedure. Same evaluation rubrics.",
    layout: "comparison",
    content: (
      <>
        <ComparisonChart />
        <p className="footer-note">
          backend-dm is an earlier highly iterative feasibility realization and
          is not part of the clean-room comparison.
        </p>
      </>
    )
  },
  {
    id: "slide-7-step-1",
    conceptualSlide: 7,
    conceptualSlideCount: slideCount,
    step: 1,
    stepCount: 3,
    title: "Next A - Let the agent prove the journeys it generates",
    layout: "diagram",
    content: (
      <>
        <MermaidDiagram
          chart={diagrams.journeyRepair}
          label="Agentic journey repair loop"
        />
        <p className="major-line accent">
          Generate <span aria-hidden="true">-&gt;</span> execute journeys{" "}
          <span aria-hidden="true">-&gt;</span> verify{" "}
          <span aria-hidden="true">-&gt;</span> repair{" "}
          <span aria-hidden="true">-&gt;</span> repeat
        </p>
        <p className="meta-note">JourneyMesh already provides UJG-derived journey execution.</p>
      </>
    )
  },
  {
    id: "slide-7-step-2",
    conceptualSlide: 7,
    conceptualSlideCount: slideCount,
    step: 2,
    stepCount: 3,
    title: "Next B - Generate runtime evidence with synthetic users",
    layout: "diagram",
    content: (
      <>
        <MermaidDiagram
          chart={diagrams.syntheticUsers}
          label="Synthetic AI users producing UJG runtime evidence"
        />
        <p className="support-line">
          Once the generated application can be executed, synthetic AI users can
          interact with it and produce UJG runtime evidence.
        </p>
        <p className="support-line">
          Runtime events mapped through the same semantics can produce
          journey-level metrics about what actually happened.
        </p>
      </>
    )
  },
  {
    id: "slide-7-step-3",
    conceptualSlide: 7,
    conceptualSlideCount: slideCount,
    step: 3,
    stepCount: 3,
    title: "Next C - Journey-aware data fetching with UJG + GraphQL",
    layout: "diagram",
    content: (
      <div className="graphql-layout">
        <MermaidDiagram
          chart={diagrams.graphql}
          label="UJG surface tree composing GraphQL selection"
        />
        <div className="side-example">
          <p className="small-heading">Research direction</p>
          <p>
            A UI is composed of nested UJG Surfaces. GraphQL also expresses
            nested data requirements. Can the Surface structure help compose the
            data request?
          </p>
          <pre>{`WorkshopSurface
  Title
  Availability
  RegistrationSurface
    Participant
    Status`}</pre>
        </div>
      </div>
    )
  },
  {
    id: "slide-8-step-1",
    conceptualSlide: 8,
    conceptualSlideCount: slideCount,
    step: 1,
    stepCount: 1,
    title: "Open questions",
    layout: "questions",
    content: (
      <>
        <ol className="questions-list">
          <li>
            Which domain concepts can legitimately be derived from interaction
            semantics, and which must remain independently modeled?
          </li>
          <li>
            Does UJG-grounded generation materially improve realization compared
            with equivalent natural-language requirements?
          </li>
          <li>
            Can one semantic model remain useful across intent, generation,
            runtime observation and evaluation?
          </li>
        </ol>
        <div className="links-footer">
          <span>ujg.specs.openuji.org</span>
          <span>github.com/openuji/ujg-generative-se-case-study</span>
          <span>journey-mesh.openuji.org</span>
        </div>
      </>
    )
  }
];
