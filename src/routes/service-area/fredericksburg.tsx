import { createFileRoute } from "@tanstack/react-router";

import { ServiceAreaPage, type ServiceAreaContent } from "~/components/ServiceAreaPage";
import { pageHead } from "~/lib/seo";
import { SITE_NAME, SITE_URL } from "~/lib/site";

export const Route = createFileRoute("/service-area/fredericksburg")({
  head: () =>
    pageHead({
      title: `Stump Grinding in Fredericksburg, TX | ${SITE_NAME}`,
      description:
        "Stump grinding in Fredericksburg, TX for homes, ranches, and wineries across Gillespie County. Live oak and cedar stumps ground below grade — free estimates with photos.",
      path: "/service-area/fredericksburg",
      image: `${SITE_URL}/images/live-oaks-960.webp`,
    }),
  component: Fredericksburg,
});

const CONTENT: ServiceAreaContent = {
  city: "Fredericksburg",
  slug: "fredericksburg",
  heroSub:
    "From Main Street lots to ranch country and wine country — live oak, cedar, and Spanish oak stumps ground below grade, with honest photo-based estimates.",
  heroImage: "/images/live-oaks-960.webp",
  heroImageAlt:
    "Live oak trees and golden grass on a ranch in the Fredericksburg wine country",
  introHeading: "Stump grinding in Fredericksburg, Texas",
  intro: [
    "Fredericksburg sits at the heart of the Texas Hill Country, where limestone hills meet ranch country and grapevines. Around town you'll find historic homes on old lots near Main Street, newer subdivisions spreading toward the county line, and ranch property stretching for miles past Stonewall and Harper. Each setting brings its own stump situations.",
    "In town, stumps usually come from live oaks and Spanish oaks that shaded a house for decades — big, gnarly bases sitting close to foundations, fences, or the driveway. Out on ranch land, the story is often different: ashe juniper (cedar) and mesquite stumps left behind after brush clearing or pasture work, sometimes by the dozen.",
    "Whatever the stump, the job is the same: grind it well below grade so the spot can be mowed, seeded, or built on. Send photos of the stump and its surroundings and we'll get you a free estimate.",
  ],
  services: [
    {
      title: "Residential",
      desc: "Historic homes near Main Street, family houses in newer subdivisions, and everything between. We grind stumps out of backyards, side yards, and front lawns with equipment sized for the lot — careful around fences, sprinklers, and landscaping.",
    },
    {
      title: "Commercial",
      desc: "Wineries, event venues, B&Bs, churches, schools, and Main Street businesses. We work around event schedules and opening hours, and we leave parking areas and entryways clean and safe for guests.",
    },
    {
      title: "Ranch",
      desc: "Gillespie County ranches from Stonewall to Harper — pasture stumps, fence lines, brush-clearing leftovers, and windbreaks. Our machines reach where a tractor can't, and we grind what's in the way of grazing, haying, or fencing.",
    },
  ],
  expectations: [
    {
      title: "Photo-based estimates",
      desc: "Send a few photos through the estimate form and we'll give you a real number based on size, access, and location — no site visit required for most jobs.",
    },
    {
      title: "Access first",
      desc: "Gates, narrow limestone lanes, and ranch entries: tell us how to get in (or leave a gate code) and we'll sort out the rest before we arrive.",
    },
    {
      title: "Grinding below grade",
      desc: "We grind the stump below the surrounding soil line so you can cover it with dirt and grass — or build right over the spot.",
    },
    {
      title: "Cleanup your way",
      desc: "Grinding leaves chips and sawdust. We'll leave them to compost in place, spread them, or haul them off — your call, agreed before we start.",
    },
    {
      title: "Respect for the property",
      desc: "We protect foundations, fences, and the live oaks you're keeping. Grinding stays within the stump's footprint.",
    },
    {
      title: "Event-friendly scheduling",
      desc: "For wineries and venues, we work around weekends and bookings so your guests never see the equipment.",
    },
  ],
  nearbyHeading: "Service area around Fredericksburg",
  nearbyIntro:
    "We travel throughout Gillespie County and the surrounding Hill Country from our Fredericksburg-area base:",
  nearby: [
    "Stonewall — about 15 minutes east on US-290",
    "Harper — about 25 minutes west on TX-290",
    "Willow City — north of town on RR 1323",
    "Luckenbach — about 20 minutes southeast",
    "Comfort — about 30 minutes east",
    "Kerrville — about 30 minutes east on TX-16",
    "Johnson City — about 30 minutes east on US-290",
    "Blanco — about 40 minutes southeast",
  ],
  otherCities: [
    { name: "Kerrville", path: "kerrville" },
    { name: "Boerne", path: "boerne" },
    { name: "Austin", path: "austin" },
    { name: "San Antonio", path: "san-antonio" },
  ],
  faqs: [
    {
      q: "Do you grind cedar (ashe juniper) stumps the way you grind live oak?",
      a: "Yes — cedar grinds well, and it's a common job in Gillespie County, where cleared pasture land leaves behind stands of cedar stumps. Cedar is dense and resinous, so it can take a little longer per stump, but the result is the same: ground below grade and ready to be covered.",
    },
    {
      q: "Can you get to stumps out on ranch land behind locked gates?",
      a: "Yes. Tell us about the gate — a code, a key, or a neighbor to let us through — when you request your estimate, and we'll coordinate entry before the day of the visit.",
    },
    {
      q: "Will grinding hurt the live oaks I'm keeping nearby?",
      a: "Grinding is contained to the stump itself, and we keep equipment off the root zones of trees you're keeping wherever possible. If a stump is fused to or growing into a tree you want to save, we'll talk through whether grinding is the right call before we start.",
    },
    {
      q: "How deep do you grind?",
      a: "Most stumps get ground a few inches below grade — enough to cover with dirt and seed or sod. If you're planning to plant, build, or lay gravel in the same spot, we can grind deeper; just mention it in the estimate request.",
    },
    {
      q: "Do you work around winery and event schedules?",
      a: "Yes — for commercial properties like wineries and event venues we schedule around busy weekends and bookings. Let us know your calendar and we'll find a time that doesn't interfere.",
    },
  ],
};

function Fredericksburg() {
  return <ServiceAreaPage {...CONTENT} />;
}
