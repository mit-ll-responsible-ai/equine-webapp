import ModelSummaryEmptyPage from "@/components/ModelSummaryPage/ModelSummaryEmptyPage";
import ModelSummaryPage from "@/components/ModelSummaryPage/ModelSummaryPage";
import { useRouter } from "next/router";

export default function Page() {
  const router = useRouter()

  if(router.query.modelName && typeof router.query.modelName === "string") {
    return <ModelSummaryPage/>
  }
  return <ModelSummaryEmptyPage/>
}