import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "~/components/ServicePage";
import { pageHead } from "~/lib/seo";
import { SERVICE_MAP } from "~/lib/services";
export const Route = createFileRoute("/services/wood-chip-removal")({ head:()=>pageHead({title:SERVICE_MAP["wood-chip-removal"].metaTitle,description:SERVICE_MAP["wood-chip-removal"].metaDescription,path:"/services/wood-chip-removal"}), component:()=> <ServicePage service={SERVICE_MAP["wood-chip-removal"]} /> });
