import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "~/components/ServicePage";
import { pageHead } from "~/lib/seo";
import { SERVICE_MAP } from "~/lib/services";
export const Route = createFileRoute("/services/ranch-cleanup")({ head:()=>pageHead({title:SERVICE_MAP["ranch-cleanup"].metaTitle,description:SERVICE_MAP["ranch-cleanup"].metaDescription,path:"/services/ranch-cleanup"}), component:()=> <ServicePage service={SERVICE_MAP["ranch-cleanup"]} /> });
