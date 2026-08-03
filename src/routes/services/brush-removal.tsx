import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "~/components/ServicePage";
import { pageHead } from "~/lib/seo";
import { SERVICE_MAP } from "~/lib/services";
export const Route = createFileRoute("/services/brush-removal")({ head:()=>pageHead({title:SERVICE_MAP["brush-removal"].metaTitle,description:SERVICE_MAP["brush-removal"].metaDescription,path:"/services/brush-removal"}), component:()=> <ServicePage service={SERVICE_MAP["brush-removal"]} /> });
