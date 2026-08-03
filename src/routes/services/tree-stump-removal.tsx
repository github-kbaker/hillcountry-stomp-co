import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "~/components/ServicePage";
import { pageHead } from "~/lib/seo";
import { SERVICE_MAP } from "~/lib/services";
export const Route = createFileRoute("/services/tree-stump-removal")({ head:()=>pageHead({title:SERVICE_MAP["tree-stump-removal"].metaTitle,description:SERVICE_MAP["tree-stump-removal"].metaDescription,path:"/services/tree-stump-removal"}), component:()=> <ServicePage service={SERVICE_MAP["tree-stump-removal"]} /> });
