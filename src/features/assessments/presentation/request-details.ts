import type { AssessmentDetail } from "@/src/features/assessments/domain/assessment.types";
import type { SummaryDetail } from "@/src/features/assessments/presentation/AssessmentSummaryCard";

/** The request fields shown when its summary card is opened, in the web's order. Empty ones are dropped by the card. */
export const getRequestDetails = (assessment: AssessmentDetail): SummaryDetail[] => [
  { label: "Parameter Type", value: assessment.parameterTypes.join(" · ") },
  { label: "Service", value: assessment.service },
  { label: "Sub Service", value: assessment.subService },
  { label: "Domain", value: assessment.domain },
  { label: "Product", value: assessment.product },
  { label: "Material Group", value: assessment.materialGroup },
  { label: "Geo Type", value: assessment.geoType },
  { label: "Geo Name", value: assessment.geoName },
  { label: "Location", value: assessment.location },
  { label: "Demanded By", value: assessment.requestedBy },
  { label: "Assessment Of", value: assessment.requestFor },
  { label: "Auditors", value: assessment.assignedTo },
  { label: "Remarks", value: assessment.remarks },
];
