import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "~/components/ServicePage";
import { pageHead } from "~/lib/seo";
import { SERVICE_MAP } from "~/lib/services";
export const Route = createFileRoute("/services/tree-company-overflow")({ head:()=>pageHead({title:SERVICE_MAP["tree-company-overflow"].metaTitle,description:SERVICE_MAP["tree-company-overflow"].metaDescription,path:"/services/tree-company-overflow"}), component:()=> <ServicePage service={SERVICE_MAP["tree-company-overflow"]} /> });
