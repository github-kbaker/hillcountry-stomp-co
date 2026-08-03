import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "~/components/ServicePage";
import { pageHead } from "~/lib/seo";
import { SERVICE_MAP } from "~/lib/services";
export const Route = createFileRoute("/services/backfill-services")({ head:()=>pageHead({title:SERVICE_MAP["backfill-services"].metaTitle,description:SERVICE_MAP["backfill-services"].metaDescription,path:"/services/backfill-services"}), component:()=> <ServicePage service={SERVICE_MAP["backfill-services"]} /> });
