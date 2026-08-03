import { createFileRoute } from "@tanstack/react-router";

import { ServiceAreaPage, type ServiceAreaContent } from "~/components/ServiceAreaPage";
import { pageHead } from "~/lib/seo";
import { SITE_NAME, SITE_URL } from "~/lib/site";

export const Route = createFileRoute("/service-area/kerrville")({
  head: () =>
    pageHead({
      title: `Stump Grinding in Kerrville, TX | ${SITE_NAME}`,
      description:
        "Stump grinding in Kerrville, TX for river lots, hillside homes, and Kerr County ranches. Live oak, cedar, and pecan stumps ground below grade — free estimates.",
      path: "/service-area/kerrville",
      image: `${SITE_URL}/images/hero-960.webp`,
    }),
  component: Kerrville,
});

const CONTENT: ServiceAreaContent = {
  city: "Kerrville",
  slug: "kerrville",
  heroSub:
    "From Guadalupe River lots to steep cedar hillsides and Kerr County ranch land — stump grinding sized to the access, priced honestly from photos.",
  heroImage: "/images/hero-960.webp",
  heroImageAlt: "Stump grinder at work in a Texas Hill Country field near Kerrville",
  introHeading: "Stump grinding in Kerrville, Texas",
  intro: [
    "Kerrville sits along the Guadalupe River at the western edge of the Hill Country, a town built on ranching heritage that's now home to a mix of longtime families, retirees, and second-home owners. The landscape runs from river bottoms to steep, cedar-covered hillsides — and each one has its own stump problems.",
    "Along the river, pecan and cypress trees shade the banks, and stumps show up in yards that have seen their share of floodwater over the years. Up the hills, live oaks and cedar dominate; stumps appear after storms, tree removals, and brush clearing on acreage west of town toward Hunt and Mountain Home.",
    "Flood debris, hillside access, and rocky caliche soil are all part of the job here. Send photos of the stump and the route to it and we'll give you a free, honest estimate.",
  ],
  services: [
    {
      title: "Residential",
      desc: "River lots and hillside homes — stumps out of lawns, slopes, and shaded backyards. We size the machine to the access, and we work carefully on grades where footing and equipment placement matter.",
    },
    {
      title: "Commercial",
      desc: "Downtown Kerrville businesses, medical offices, schools, churches, and riverfront properties. We work around business hours and keep entryways and parking areas clean.",
    },
    {
      title: "Ranch",
      desc: "Kerr County ranches, hunting leases, and acreage toward Ingram, Hunt, and Mountain Home. Pasture stumps, fence-line clearing, and cedar work — ground so grazing and mowing aren't interrupted.",
    },
  ],
  expectations: [
    {
      title: "Honest access calls",
      desc: "Steep hillsides and narrow river-bank paths aren't always grinder-accessible. We'll tell you straight what a machine can reach and what it can't — better than promising and failing.",
    },
    {
      title: "River-adjacent care",
      desc: "On properties near the Guadalupe we check for erosion, debris, and soft ground before bringing equipment in, and we grind to leave a safe, even surface.",
    },
    {
      title: "Grinding below grade",
      desc: "Stumps go below the surrounding soil line, so the spot can be covered with dirt and grass, gravel, or whatever you have planned.",
    },
    {
      title: "Chip cleanup, your way",
      desc: "Leave chips to compost, spread them over the ground area, or have us haul them — we agree on it before the work starts.",
    },
    {
      title: "Species-aware timing",
      desc: "Pecan stumps with spreading roots grind differently than compact live oak bases. We price the time by what's actually there.",
    },
    {
      title: "Respect for slopes",
      desc: "We work carefully around the roots of trees you're keeping and protect terraced beds and retaining walls.",
    },
  ],
  nearbyHeading: "Service area around Kerrville",
  nearbyIntro:
    "We cover Kerr County and the surrounding Hill Country from our Kerrville-area base:",
  nearby: [
    "Ingram — about 10 minutes west on TX-27",
    "Hunt — about 15 minutes west on TX-39",
    "Mountain Home — about 25 minutes southwest",
    "Center Point — about 15 minutes southeast on TX-27",
    "Comfort — about 25 minutes east on I-10",
    "Fredericksburg — about 30 minutes north on TX-16",
    "Bandera — about 40 minutes south",
    "Harper — about 30 minutes northwest",
  ],
  otherCities: [
    { name: "Fredericksburg", path: "fredericksburg" },
    { name: "Boerne", path: "boerne" },
    { name: "Austin", path: "austin" },
    { name: "San Antonio", path: "san-antonio" },
  ],
  faqs: [
    {
      q: "Can a stump grinder work on a steep hillside lot?",
      a: "It depends on the grade and the route to the stump. A steep slope with a narrow path may need a smaller machine, and some slopes just aren't safe for tracked or wheeled equipment. Send photos of the hillside and the stump and we'll give you a straight answer.",
    },
    {
      q: "What about stumps near the Guadalupe River?",
      a: "We check river-adjacent areas for erosion, flood debris, and soft soil before we bring equipment in. Grinding stumps on a river lot removes tripping hazards and leaves the bank easier to maintain — we keep the work contained and clean up after ourselves.",
    },
    {
      q: "Do pecan stumps grind differently than oak?",
      a: "Pecan is a hardwood with a spreading root system, so a pecan stump can take a little longer and leave more ground disturbance than a smaller oak. It grinds fine — we just size the time and the estimate honestly.",
    },
    {
      q: "Can you reach ranch stumps on hunting-lease property?",
      a: "Yes — we serve ranch and lease property across Kerr County and the surrounding area. Let us know the gate and road situation ahead of time so we can plan access.",
    },
    {
      q: "How do I get an estimate without a site visit?",
      a: "Use the free estimate form and upload a few photos of the stump, the ground around it, and the path a machine would take. That's usually enough for us to quote the job.",
    },
  ],
};

function Kerrville() {
  return <ServiceAreaPage {...CONTENT} />;
}
