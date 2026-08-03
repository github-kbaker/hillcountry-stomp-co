import { createFileRoute } from "@tanstack/react-router";

import { ServiceAreaPage, type ServiceAreaContent } from "~/components/ServiceAreaPage";
import { pageHead } from "~/lib/seo";
import { SITE_NAME, SITE_URL } from "~/lib/site";

export const Route = createFileRoute("/service-area/boerne")({
  head: () =>
    pageHead({
      title: `Stump Grinding in Boerne, TX | ${SITE_NAME}`,
      description:
        "Stump grinding in Boerne, TX for Hill Country homes, HOAs, and Kendall County acreage. Live oak stumps ground below grade on rocky limestone lots — free estimates.",
      path: "/service-area/boerne",
      image: `${SITE_URL}/images/operator-960.webp`,
    }),
  component: Boerne,
});

const CONTENT: ServiceAreaContent = {
  city: "Boerne",
  slug: "boerne",
  heroSub:
    "From the Hill Country Mile to live oak-heavy subdivisions and Kendall County acreage — stump grinding on rocky limestone ground, with cleanup that fits neighborhood rules.",
  heroImage: "/images/operator-960.webp",
  heroImageAlt:
    "Professional operator running a stump grinder at a residential property in Boerne",
  introHeading: "Stump grinding in Boerne, Texas",
  intro: [
    "Boerne is one of the fastest-growing towns in the Hill Country, anchored by its historic Hill Country Mile along Main Street and surrounded by master-planned neighborhoods that keep the live oaks the developers promised to save. It's the kind of town where a big old oak in the front yard is part of the reason you bought the house.",
    "That means a lot of Boerne stump work happens close to homes: a live oak taken down in a storm, a cedar removed for views, a dead tree cleared before building an addition. Lots here are live oak-heavy and the soil is shallow limestone — rocky ground is the norm, not the exception.",
    "New construction adds its own layer: stumps cleared from building pads and driveway runs, then grinding needed again after the dust settles. Whatever your stump situation, photos get you a free estimate — usually enough for us to quote without a site visit.",
  ],
  services: [
    {
      title: "Residential",
      desc: "Subdivision lots, Hill Country Mile older homes, and new-construction lots. We grind stumps out of front yards, backyards, and side setbacks — careful with sprinklers, fences, and the live oaks you're keeping.",
    },
    {
      title: "Commercial",
      desc: "Retail along Main Street and I-10 frontage, restaurants, churches, schools, and HOA common areas. We work around business hours and leave parking lots clean and safe.",
    },
    {
      title: "Ranch",
      desc: "Kendall County acreage, equestrian properties, and farm-to-market holdings from Comfort to Bergheim. Pasture, fence-line, and corral-area stumps ground so mowing and grazing go smoothly.",
    },
  ],
  expectations: [
    {
      title: "Rocky ground is expected",
      desc: "Boerne's limestone soil is hard on cutting teeth. We account for that in the estimate and bring the right machine — rocky lots grind fine, they just work a little differently.",
    },
    {
      title: "HOA-aware scheduling",
      desc: "Many Boerne neighborhoods have covenants about noise and chip disposal. Tell us the rules when you book, and we'll work within them — including hauling chips if the HOA requires it.",
    },
    {
      title: "Grinding below grade",
      desc: "Stumps go below the surrounding soil line so you can reseed, resod, or build over the spot.",
    },
    {
      title: "Protecting the oaks you keep",
      desc: "We keep equipment off the root zones of trees you're keeping and grind only the stump at hand.",
    },
    {
      title: "Cleanup options",
      desc: "Leave chips, spread them, or haul them — decided up front so there are no surprises.",
    },
    {
      title: "New-construction friendly",
      desc: "We coordinate with builders and site crews on pads, driveways, and utility runs.",
    },
  ],
  nearbyHeading: "Service area around Boerne",
  nearbyIntro:
    "We cover Kendall County and the surrounding Hill Country from our Boerne-area base:",
  nearby: [
    "Comfort — about 20 minutes northwest on TX-27",
    "Bergheim — about 15 minutes west",
    "Sisterdale — about 20 minutes northwest",
    "Spring Branch — about 15 minutes south on US-281",
    "Bulverde — about 15 minutes southeast",
    "Fair Oaks Ranch — about 10 minutes south on I-10",
    "San Antonio — about 30 minutes south",
    "Fredericksburg — about 40 minutes north on TX-16",
  ],
  otherCities: [
    { name: "Fredericksburg", path: "fredericksburg" },
    { name: "Kerrville", path: "kerrville" },
    { name: "Austin", path: "austin" },
    { name: "San Antonio", path: "san-antonio" },
  ],
  faqs: [
    {
      q: "My HOA requires chips to be removed — do you offer that?",
      a: "Yes. Haul-away is a standard cleanup option, and we're used to neighborhood rules in Boerne's newer developments. Mention the HOA's requirements when you request the estimate and we'll include the right cleanup in the quote.",
    },
    {
      q: "The soil here is full of rock — can you still grind?",
      a: "Yes. Boerne's shallow limestone doesn't stop a grinder; it just wears cutting teeth faster, which we factor into pricing. On extremely rocky or caliche-packed spots we'll tell you if anything unusual is involved.",
    },
    {
      q: "Can you grind between live oaks without damaging the ones I'm keeping?",
      a: "Yes — grinding stays inside the stump's footprint, and we keep equipment off the root zones of neighboring trees where the layout allows. If a stump is growing into a tree you want to save, we'll talk it through before starting.",
    },
    {
      q: "Do you grind stumps on new-construction lots?",
      a: "Yes — it's a common job. Whether the stump is on the building pad, a driveway run, or a utility trench, we coordinate around construction schedules and underground utilities.",
    },
    {
      q: "How deep is the grind?",
      a: "Typically a few inches below grade — enough to cover with dirt and grass. Deeper grinding is available if you're planting, building, or laying gravel in that spot.",
    },
  ],
};

function Boerne() {
  return <ServiceAreaPage {...CONTENT} />;
}
