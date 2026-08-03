import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "~/components/ServicePage";
import { pageHead } from "~/lib/seo";
import { SERVICE_MAP } from "~/lib/services";
export const Route = createFileRoute("/services/contractor-subcontract-services")({ head:()=>pageHead({title:SERVICE_MAP["contractor-subcontract-services"].metaTitle,description:SERVICE_MAP["contractor-subcontract-services"].metaDescription,path:"/services/contractor-subcontract-services"}), component:()=> <ServicePage service={SERVICE_MAP["contractor-subcontract-services"]} /> });
