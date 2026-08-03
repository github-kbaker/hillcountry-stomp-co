import { createFileRoute } from "@tanstack/react-router";
import { ServicePage } from "~/components/ServicePage";
import { pageHead } from "~/lib/seo";
import { SERVICE_MAP } from "~/lib/services";
export const Route = createFileRoute("/services/residential-stump-grinding")({ head:()=>pageHead({title:SERVICE_MAP["residential-stump-grinding"].metaTitle,description:SERVICE_MAP["residential-stump-grinding"].metaDescription,path:"/services/residential-stump-grinding"}), component:()=> <ServicePage service={SERVICE_MAP["residential-stump-grinding"]} /> });
