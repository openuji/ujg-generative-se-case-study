import { ComparisonChart } from "./ComparisonChart";
import { MermaidDiagram } from "./MermaidDiagram";
import { diagrams } from "./diagrams";
import type { SVGProps } from "react";
import type { DeckPage } from "./types";

const slideCount = 8;

function FigmaBrandIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 38 57" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z"
        fill="#1ABCFE"
      />
      <path
        d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z"
        fill="#0ACF83"
      />
      <path
        d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z"
        fill="#FF7262"
      />
      <path
        d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z"
        fill="#F24E1E"
      />
      <path
        d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z"
        fill="#A259FF"
      />
    </svg>
  );
}

function JiraBrandIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005Zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.215h2.129v2.058a5.218 5.218 0 0 0 5.215 5.215h.007V6.758a1.001 1.001 0 0 0-1.008-1.001ZM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057a5.215 5.215 0 0 0 5.215 5.215V1.001A1.001 1.001 0 0 0 23.013 0Z"
        fill="#0052CC"
      />
    </svg>
  );
}

function GitBrandIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 97 97" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M92.71 44.408 52.591 4.291c-2.31-2.311-6.057-2.311-8.369 0l-8.33 8.332 10.566 10.566c2.456-.83 5.272-.273 7.229 1.685 1.969 1.97 2.521 4.81 1.67 7.275l10.186 10.185c2.465-.85 5.307-.3 7.275 1.671 2.75 2.75 2.75 7.206 0 9.958-2.752 2.751-7.208 2.751-9.961 0-2.068-2.07-2.58-5.11-1.531-7.658l-9.5-9.499v24.997c.67.332 1.303.774 1.862 1.332 2.75 2.75 2.75 7.206 0 9.959-2.75 2.749-7.209 2.749-9.957 0-2.75-2.754-2.75-7.21 0-9.959.68-.679 1.467-1.193 2.307-1.537V35.84c-.84-.344-1.625-.853-2.307-1.537-2.083-2.082-2.584-5.14-1.516-7.698L31.798 16.002 4.288 43.511c-2.311 2.313-2.311 6.06 0 8.371l40.12 40.118c2.31 2.311 6.057 2.311 8.369 0L92.71 52.067c2.311-2.311 2.311-6.059 0-8.369Z"
        fill="#F05032"
      />
    </svg>
  );
}

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
            <FigmaBrandIcon
              className="artifact-brand-icon figma-brand-icon"
              aria-hidden="true"
            />
            <span className="artifact-label">Figma</span>
          </div>
          <div className="artifact island-jira">
            <JiraBrandIcon
              className="artifact-brand-icon jira-brand-icon"
              aria-hidden="true"
            />
            <span className="artifact-label">Jira</span>
          </div>
          <div className="artifact island-git">
            <GitBrandIcon
              className="artifact-brand-icon git-brand-icon"
              aria-hidden="true"
            />
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
        {/* <p className="footer-note">
          backend-dm is an earlier highly iterative feasibility realization and
          is not part of the clean-room comparison.
        </p> */}
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
