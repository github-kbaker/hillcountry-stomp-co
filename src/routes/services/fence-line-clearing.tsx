import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "~/components/ServicePage";
import { pageHead } from "~/lib/seo";
import { SERVICE_MAP } from "~/lib/services";
export const Route = createFileRoute("/services/fence-line-clearing")({ head:()=>pageHead({title:SERVICE_MAP["fence-line-clearing"].metaTitle,description:SERVICE_MAP["fence-line-clearing"].metaDescription,path:"/services/fence-line-clearing"}), component:()=> <ServicePage service={SERVICE_MAP["fence-line-clearing"]} /> });
