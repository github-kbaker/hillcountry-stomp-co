import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "~/components/ServicePage";
import { pageHead } from "~/lib/seo";
import { SERVICE_MAP } from "~/lib/services";
export const Route = createFileRoute("/services/commercial-stump-grinding")({ head:()=>pageHead({title:SERVICE_MAP["commercial-stump-grinding"].metaTitle,description:SERVICE_MAP["commercial-stump-grinding"].metaDescription,path:"/services/commercial-stump-grinding"}), component:()=> <ServicePage service={SERVICE_MAP["commercial-stump-grinding"]} /> });
