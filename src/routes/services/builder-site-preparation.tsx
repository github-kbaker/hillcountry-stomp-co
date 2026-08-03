import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "~/components/ServicePage";
import { pageHead } from "~/lib/seo";
import { SERVICE_MAP } from "~/lib/services";
export const Route = createFileRoute("/services/builder-site-preparation")({ head:()=>pageHead({title:SERVICE_MAP["builder-site-preparation"].metaTitle,description:SERVICE_MAP["builder-site-preparation"].metaDescription,path:"/services/builder-site-preparation"}), component:()=> <ServicePage service={SERVICE_MAP["builder-site-preparation"]} /> });
