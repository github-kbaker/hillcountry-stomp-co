import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "~/components/ServicePage";
import { pageHead } from "~/lib/seo";
import { SERVICE_MAP } from "~/lib/services";
export const Route = createFileRoute("/services/surface-root-grinding")({ head:()=>pageHead({title:SERVICE_MAP["surface-root-grinding"].metaTitle,description:SERVICE_MAP["surface-root-grinding"].metaDescription,path:"/services/surface-root-grinding"}), component:()=> <ServicePage service={SERVICE_MAP["surface-root-grinding"]} /> });
