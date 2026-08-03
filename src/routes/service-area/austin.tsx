import { createFileRoute } from "@tanstack/react-router";

import { ServiceAreaPage, type ServiceAreaContent } from "~/components/ServiceAreaPage";
import { pageHead } from "~/lib/seo";
import { SITE_NAME, SITE_URL } from "~/lib/site";

export const Route = createFileRoute("/service-area/austin")({
  head: () =>
    pageHead({
      title: `Stump Grinding in Austin, TX | ${SITE_NAME}`,
      description:
        "Stump grinding in Austin, TX for established neighborhoods with mature oaks, plus commercial and HOA properties. Cedar elm and live oak stumps ground below grade — free estimates.",
      path: "/service-area/austin",
      image: `${SITE_URL}/images/mulch-960.webp`,
    }),
  component: Austin,
});

const CONTENT: ServiceAreaContent = {
  city: "Austin",
  slug: "austin",
  heroSub:
    "From 1930s bungalows under mature oaks to the suburbs and the Hill Country fringe — stump grinding on city lots, scheduled by part of town.",
  heroImage: "/images/mulch-960.webp",
  heroImageAlt: "Wood chips left after stump grinding on an Austin property",
  introHeading: "Stump grinding in Austin, Texas",
  intro: [
    "Austin's tree canopy is one of the reasons people love the city — and it's the reason stump grinding is so common here. Older neighborhoods like Tarrytown, Hyde Park, Barton Hills, and the Allandale area were built around mature live oaks and cedar elms that have been shading houses for fifty years or more.",
    "When one of those trees finally comes down — storm damage, disease, construction — it leaves a stump in a yard that's often full of other trees, utility lines, and tight parking. Grinding it below grade clears the way for new plantings, lawn, patios, or building additions without disturbing the trees around it.",
    "Austin is a big city, and we schedule by area. Whether you're central, north of the river, east, or out toward Dripping Springs and Lakeway, send photos through the estimate form and we'll give you a free quote with travel included.",
  ],
  services: [
    {
      title: "Residential",
      desc: "From 1930s bungalows in Hyde Park to newer builds in the suburbs — stumps out of front yards, backyards, and side yards, worked around parked cars, fences, and the big oaks next door.",
    },
    {
      title: "Commercial",
      desc: "Apartment complexes, office parks, restaurants, HOA common areas, and municipal grounds. We schedule around tenants and business hours and leave parking lots and entryways clean.",
    },
    {
      title: "Ranch",
      desc: "On the Hill Country fringe west of town and the ranchland east of I-35 — pasture, fence-line, and windbreak stumps across larger acreage.",
    },
  ],
  expectations: [
    {
      title: "City-lot logistics",
      desc: "Narrow streets, parked cars, and shallow utility runs are part of most Austin jobs. We bring the right size machine and work carefully around what's buried and parked.",
    },
    {
      title: "Protected-tree awareness",
      desc: "Austin's tree ordinance protects heritage and significant trees. If a protected tree was removed, the permit and removal are separate from grinding the leftover stump — we grind stumps of already-removed trees and don't remove live protected trees.",
    },
    {
      title: "Grinding below grade",
      desc: "Stumps go below the surrounding soil line, ready for seed, sod, mulch, or a new patio pad.",
    },
    {
      title: "Cleanup options",
      desc: "Leave chips, spread them, or haul them — we'll match whatever your neighborhood expects.",
    },
    {
      title: "Scheduling by area",
      desc: "Because Austin is spread out, we batch jobs by part of town. We'll confirm a time window ahead of the visit and keep you posted.",
    },
    {
      title: "Depth for replanting",
      desc: "Planning a new tree in the same spot? We can grind deeper and clean out the planting pocket — just say so on the form.",
    },
  ],
  nearbyHeading: "Service area around Austin",
  nearbyIntro:
    "We cover Austin and the surrounding metro, scheduling by part of town:",
  nearby: [
    "Round Rock — about 20 minutes north",
    "Cedar Park — about 20 minutes northwest",
    "Pflugerville — about 20 minutes northeast",
    "Georgetown — about 30 minutes north",
    "Buda & Kyle — about 20–30 minutes south on I-35",
    "Dripping Springs — about 30 minutes west",
    "Lakeway — about 30 minutes west on RM 620",
    "Manor — about 20 minutes east",
  ],
  otherCities: [
    { name: "Fredericksburg", path: "fredericksburg" },
    { name: "Kerrville", path: "kerrville" },
    { name: "Boerne", path: "boerne" },
    { name: "San Antonio", path: "san-antonio" },
  ],
  faqs: [
    {
      q: "What about heritage oaks and Austin's tree ordinance?",
      a: "We grind stumps of trees that are already removed — we don't remove live protected trees. If a heritage or significant tree came down and you're unsure about permitting, that's between you and the city (or your arborist); once the removal is settled, grinding the leftover stump is a straightforward job for us.",
    },
    {
      q: "How far will you travel in the metro?",
      a: "We cover Austin and the surrounding metro, from the core neighborhoods to the suburbs and the Hill Country fringe. Travel distance is factored into the estimate, so a photo-based quote is still accurate.",
    },
    {
      q: "Can you grind flush for a new lawn or planting bed?",
      a: "Yes. If you're reseeding or resodding, we grind below grade so soil covers the grindings. If you're planting a new tree in the same spot, we can grind deeper and clean out the pocket — just mention it on the form.",
    },
    {
      q: "Cedar elm stumps are everywhere — are they hard to grind?",
      a: "Cedar elm has a dense, spreading root system that can make the stump slow to grind, but it's a routine job for us. It's why a photo-based estimate is a good idea — the species and root flare change the time.",
    },
    {
      q: "My HOA wants the chips gone the same day — can you do that?",
      a: "Yes, haul-away is a standard cleanup option, and we coordinate with HOA rules on work hours and debris. Put the requirement in the estimate notes and we'll include it.",
    },
  ],
};

function Austin() {
  return <ServiceAreaPage {...CONTENT} />;
}
