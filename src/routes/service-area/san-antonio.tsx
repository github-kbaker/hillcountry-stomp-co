import { createFileRoute } from "@tanstack/react-router";

import { ServiceAreaPage, type ServiceAreaContent } from "~/components/ServiceAreaPage";
import { pageHead } from "~/lib/seo";
import { SITE_NAME, SITE_URL } from "~/lib/site";

export const Route = createFileRoute("/service-area/san-antonio")({
  head: () =>
    pageHead({
      title: `Stump Grinding in San Antonio, TX | ${SITE_NAME}`,
      description:
        "Stump grinding in San Antonio, TX for older neighborhoods, gated communities, and acreage on the Hill Country fringe. Live oak and mesquite stumps ground below grade — free estimates.",
      path: "/service-area/san-antonio",
      image: `${SITE_URL}/images/hero-960.webp`,
    }),
  component: SanAntonio,
});

const CONTENT: ServiceAreaContent = {
  city: "San Antonio",
  slug: "san-antonio",
  heroSub:
    "From century-old lots in Monte Vista and King William to gated subdivisions and Hill Country acreage — stump grinding across the full metro.",
  heroImage: "/images/hero-960.webp",
  heroImageAlt: "Stump grinder at work on a San Antonio-area property",
  introHeading: "Stump grinding in San Antonio, Texas",
  intro: [
    "San Antonio is a big metro with every kind of stump situation you can imagine. In older neighborhoods like Monte Vista, King William, Alamo Heights, and Olmos Park, mature live oaks and cedar elms tower over houses on lots that were laid out a century ago — tight access, narrow streets, and stumps close to foundations.",
    "Farther out, the picture changes: HOA-governed subdivisions in Stone Oak, Alamo Ranch, and the far north side, where tree removal often comes with rules about noise and debris; and toward the northwest, acreage in Helotes, Leon Springs, and the Bandera Road corridor where mesquite and live oak stumps dot pastures and horse properties.",
    "From a historic in-town lot to a five-acre spread, the goal is the same: grind the stump below grade and leave the ground clean, level, and ready for whatever comes next. Photos get you a free estimate — with gate codes and HOA notes welcome.",
  ],
  services: [
    {
      title: "Residential",
      desc: "Historic neighborhoods and modern subdivisions alike — stumps out of small in-town yards and big suburban lots, worked around fences, driveways, and utility boxes.",
    },
    {
      title: "Commercial",
      desc: "Retail centers, restaurants, medical campuses, schools, and HOA common areas across the metro. We schedule around business hours and keep parking lots and entryways clean.",
    },
    {
      title: "Ranch",
      desc: "Bexar County's Hill Country fringe and beyond — Helotes-area horse properties, Medina County ranchland, and acreage along the Bandera corridor. Pasture and fence-line stumps ground for grazing and mowing.",
    },
  ],
  expectations: [
    {
      title: "Gated and HOA communities",
      desc: "Many San Antonio neighborhoods are gated or HOA-managed. We'll need gate access arranged ahead of time, and we'll work within any noise and cleanup rules — chip haul-away included.",
    },
    {
      title: "Tight in-town access",
      desc: "Older neighborhoods can mean narrow driveways, on-street parking, and shallow utility lines. We bring the right size machine and tell you honestly if access changes the job.",
    },
    {
      title: "Grinding below grade",
      desc: "Stumps go below the surrounding soil line so the spot can be covered, seeded, or built over.",
    },
    {
      title: "Species-aware grinding",
      desc: "Mesquite on the west side grinds differently than live oak in Alamo Heights. We price the job by what's actually there — photos help us get it right.",
    },
    {
      title: "Cleanup your way",
      desc: "Leave chips, spread them, or haul them — agreed before we start, and matching your neighborhood's expectations.",
    },
    {
      title: "Gated-entry planning",
      desc: "Visitor passes, gate codes, or guard contact — we confirm entry details before the day of the visit.",
    },
  ],
  nearbyHeading: "Service area around San Antonio",
  nearbyIntro:
    "We cover San Antonio and the Hill Country fringe to the north and west:",
  nearby: [
    "Helotes — about 20 minutes northwest",
    "Leon Springs — about 20 minutes north on I-10",
    "Fair Oaks Ranch — about 25 minutes north",
    "Bulverde — about 30 minutes north",
    "Schertz & Cibolo — about 25 minutes northeast",
    "Castroville — about 30 minutes west",
    "Boerne — about 30 minutes north",
    "Bandera — about 45 minutes northwest",
  ],
  otherCities: [
    { name: "Fredericksburg", path: "fredericksburg" },
    { name: "Kerrville", path: "kerrville" },
    { name: "Boerne", path: "boerne" },
    { name: "Austin", path: "austin" },
  ],
  faqs: [
    {
      q: "Do you work in gated communities?",
      a: "Yes — many of our San Antonio-area jobs are in gated or HOA neighborhoods. We'll ask for gate access details (code, visitor pass, or guard info) when you book, and we'll confirm everything before the day of the visit.",
    },
    {
      q: "How do mesquite stumps grind?",
      a: "Mesquite is dense, and the tree is famous for sprouting from roots left in the ground. We grind the stump well below grade, which removes the bulk of the problem — but on mesquite, lateral roots can occasionally sprout later. That's a property of the tree, not the grind; we'll tell you honestly what to expect.",
    },
    {
      q: "Can you get to a stump between houses with a tight side gate?",
      a: "Sometimes. It depends on the gap, the machine, and what's on the other side. Send photos of the gate and the stump and we'll tell you straight whether the big machine fits or whether we need a smaller unit — or a different approach.",
    },
    {
      q: "Do you serve the older neighborhoods like Monte Vista and King William?",
      a: "Yes — narrow streets and tight lots are routine for us. We use appropriately sized equipment and work around parking and utility constraints.",
    },
    {
      q: "How deep do you grind for turf restoration?",
      a: "We grind a few inches below grade as standard — enough to cover with soil and grass. If you're planting, adding hardscape, or laying gravel, we can go deeper; just note it on the estimate form.",
    },
  ],
};

function SanAntonio() {
  return <ServiceAreaPage {...CONTENT} />;
}
